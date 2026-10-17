"""Whiteboard 'hand-drawn' explainer renderer (After Skool style).
usage: python3 render.py [preview t1 t2 ...]   -> PNG stills
       python3 render.py video                 -> out.mp4
"""
import sys, json, math, subprocess, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
import warnings; warnings.filterwarnings('ignore')
from skimage.morphology import skeletonize, disk, binary_dilation

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, '..', 'fonts')
F_TITLE = os.path.join(FONTS, 'permanent-marker-latin-400-normal.ttf')
F_BUBBLE = os.path.join(FONTS, 'caveat-latin-700-normal.ttf')
F_SUB = os.path.join(FONTS, 'montserrat-latin-900-normal.ttf')
RED = (222, 30, 30)
SUB_ACTIVE = (255, 205, 0)
TITLE_H, VIEW_TOP, GAP = 150, 210, 70
IMG_MAX_W, IMG_MAX_H = 900, 1170
RNG = np.random.default_rng(7)

# ---------------------------------------------------------------- scenes
# bubble: (text, cx, cy, tail_x, tail_y) in ORIGINAL image pixel coords (1024x1536)
SCENES = [
    dict(img='s1', title='PÉCHÉ = FAUTES ?', bubble=('Juste ça ?', 250, 260, 470, 420)),
    dict(img='s2', title='NÉS PÉCHEURS'),
    dict(img='s3', title='EFFORTS INUTILES', bubble=('Encore ?!', 230, 300, 330, 520)),
    dict(img='s4', title='LA LOI = MIROIR'),
    dict(img='s5', title='LE BAPTÊME'),
    dict(img='s6', title='LA CROIX'),
    dict(img='s7', title='CŒUR LAVÉ'),
    dict(img='s8', title='ET TOI ?'),
    dict(img='s9', title='LIVRE 1 OFFERT'),
]
END = dict(img='end', title='ÉCRIS-MOI !')
END_HOLD = 3.6  # seconds the end card stays after the voice

# ---------------------------------------------------------------- helpers
def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2

def clamp01(x):
    return min(max(x, 0.0), 1.0)

def load_rgb(name):
    im = np.asarray(Image.open(os.path.join(HERE, 'img', name + '.png')).convert('RGB')).astype(np.float32)
    return np.clip(im * 255 / 238, 0, 255)  # push paper to pure white

def crop_content(im, pad=24):
    m = im.min(2) < 215
    ys, xs = np.nonzero(m)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, im.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, im.shape[1])
    return im[y0:y1, x0:x1], (x0, y0)

def fit(im, mw, mh):
    h, w = im.shape[:2]
    s = min(mw / w, mh / h)
    out = Image.fromarray(im.astype(np.uint8)).resize((round(w * s), round(h * s)), Image.LANCZOS)
    return np.asarray(out).astype(np.float32), s

# ---------------------------------------------------------------- stroke order
def stroke_order(img):
    """Return (ink alpha, order map in [0,1] per pixel, ordered skeleton coords)."""
    maxc = img.max(2)
    ink_a = np.clip((205 - maxc) / 95, 0, 1)
    ink = ink_a > 0.3
    skel = skeletonize(binary_dilation(ink, disk(1)))
    lab, n = ndi.label(binary_dilation(ink, disk(4)))
    sy, sx = np.nonzero(skel)
    slab = lab[sy, sx]
    groups = {}
    for i, l in enumerate(slab):
        groups.setdefault(l, []).append(i)
    keys = list(groups)
    cent = np.array([[sy[groups[k]].mean(), sx[groups[k]].mean()] for k in keys])
    size = np.array([len(groups[k]) for k in keys])
    hh, ww = skel.shape
    seq_y, seq_x = [], []
    visited = np.zeros_like(skel, bool)
    pen = np.array([0.0, 0.0])
    for big in (True, False):
        remaining = [i for i in range(len(keys)) if (size[i] >= 250) == big]
        while remaining:
            d = ((cent[remaining] - pen) ** 2).sum(1)
            j = remaining.pop(int(np.argmin(d)))
            idx = np.array(groups[keys[j]])
            py, px = sy[idx], sx[idx]
            k0 = int(np.argmin((py - pen[0]) ** 2 + (px - pen[1]) ** 2))
            # DFS over skeleton pixels of this element; restart for disconnected bits
            order_pts = list(zip(py.tolist(), px.tolist()))
            starts = [order_pts[k0]] + order_pts
            for st in starts:
                if visited[st]:
                    continue
                stack = [st]
                while stack:
                    y, x = stack.pop()
                    if visited[y, x]:
                        continue
                    visited[y, x] = True
                    seq_y.append(y); seq_x.append(x)
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < hh and 0 <= xx < ww and skel[yy, xx] and not visited[yy, xx]:
                            stack.append((yy, xx))
            pen = np.array([seq_y[-1], seq_x[-1]], float)
    N = len(seq_y)
    ordimg = np.zeros(skel.shape, np.float32)
    ordimg[seq_y, seq_x] = (np.arange(N) + 1) / N
    _, (iy, ix) = ndi.distance_transform_edt(~skel, return_indices=True)
    order_map = ordimg[iy, ix]
    order_map[ink_a <= 0] = 2.0  # never revealed as line (comes with colour)
    return ink_a, order_map, np.stack([seq_x, seq_y], 1).astype(np.float32)

# ---------------------------------------------------------------- text layers
def text_layer(text, font_path, size, color, max_w):
    while True:
        f = ImageFont.truetype(font_path, size)
        l, t, r, b = f.getbbox(text)
        if r - l <= max_w or size < 30:
            break
        size -= 4
    im = Image.new('RGBA', (r - l + 20, b - t + 20), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10 - l, 10 - t), text, font=f, fill=color + (255,))
    return np.asarray(im).astype(np.float32)

def bubble_path(cx, cy, rx, ry, tx, ty):
    """Hand-drawn speech bubble outline with tail, as a polyline (list of xy)."""
    pts = []
    ang_tail = math.atan2(ty - cy, tx - cx)
    a0 = ang_tail + 0.22
    n = 90
    for i in range(n + 1):
        a = a0 + (2 * math.pi - 0.44) * i / n
        wob = 1 + 0.025 * math.sin(3 * a + 1.3) + RNG.normal(0, 0.004)
        pts.append((cx + rx * wob * math.cos(a), cy + ry * wob * math.sin(a)))
    pts.append((tx, ty))
    pts.append((cx + rx * math.cos(a0), cy + ry * math.sin(a0)))
    return pts

# ---------------------------------------------------------------- build scenes
def build(words):
    hand = Image.open(os.path.join(HERE, 'img', 'hand_ext.png')).convert('RGBA')
    hs = 0.6
    hand = hand.resize((round(hand.width * hs), round(hand.height * hs)), Image.LANCZOS)
    HAND = np.asarray(hand).astype(np.float32)
    HAND_TIP = (252 * hs, 198 * hs)

    starts = []
    for si in range(len(SCENES)):
        ws = [w for w in words if w['scene'] == si]
        starts.append(ws[0]['s'])
    voice_end = words[-1]['e']
    blocks = []
    y = 0
    for i, sc in enumerate(SCENES + [END]):
        b = dict(sc)
        raw = load_rgb(sc['img'])
        if sc is END:
            img, s = fit(raw, 800, 1200)
            off = (0, 0)
        else:
            cropped, off = crop_content(raw)
            img, s = fit(cropped, IMG_MAX_W, IMG_MAX_H)
        h, w = img.shape[:2]
        b.update(top=y, img=img, ix=(W - w) // 2, iy=y + TITLE_H, w=w, h=h)
        b['title_l'] = text_layer(sc['title'], F_TITLE, 96, RED, 980)
        tl = b['title_l']
        b['tx'] = (W - tl.shape[1]) // 2
        b['ty'] = y + (TITLE_H - tl.shape[0]) // 2 + 4
        if sc is END:
            b['ink'] = None
            pad = 16
            x0, y0, x1, y1 = b['ix'] - pad, b['iy'] - pad, b['ix'] + w + pad, b['iy'] + h + pad
            frame = []
            for (ax, ay), (bx, by) in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0 - 8))):
                for k in range(30):
                    t = k / 30
                    frame.append((ax + (bx - ax) * t + RNG.normal(0, .8), ay + (by - ay) * t + RNG.normal(0, .8)))
            b['frame'] = frame
        else:
            b['ink'], b['order'], b['seq'] = stroke_order(img)
            if 'bubble' in sc:
                txt, cx, cy, tx, ty = sc['bubble']
                to_board = lambda X, Y: (b['ix'] + (X - off[0]) * s, b['iy'] + (Y - off[1]) * s)
                bx, by = to_board(cx, cy)
                tbx, tby = to_board(tx, ty)
                tlay = text_layer(txt, F_BUBBLE, 70, (20, 20, 20), 360)
                rx, ry = tlay.shape[1] / 2 + 34, tlay.shape[0] / 2 + 26
                bx = min(max(bx, rx + 40), W - rx - 40)
                b['bub'] = dict(path=bubble_path(bx, by, rx, ry, tbx, tby), text=tlay,
                                tx=int(bx - tlay.shape[1] / 2), ty=int(by - tlay.shape[0] / 2))
        blocks.append(b)
        y += TITLE_H + h + GAP

    # timeline
    for i, b in enumerate(blocks):
        if i == 0:
            T0 = 0.0
        elif i < len(SCENES):
            T0 = starts[i] - 0.7
        else:
            T0 = voice_end + 0.1
        b['T0'] = T0
        b['cam'] = b['top'] - VIEW_TOP
    for i, b in enumerate(blocks):
        E = blocks[i + 1]['T0'] if i + 1 < len(blocks) else blocks[i]['T0'] + 1.5 + END_HOLD
        b['E'] = E
        slide = 0 if i == 0 else 1.3
        b['slide'] = (b['T0'], b['T0'] + slide)
        t = b['T0'] + (0.1 if i == 0 else 0.95)
        b['t_title'] = (t, t + 0.55); t += 0.55
        if b.get('ink') is None:  # end card
            b['t_frame'] = (t, t + 0.8)
            b['t_photo'] = (t + 0.5, t + 1.3)
            b['t_exit'] = (t + 0.8, t + 1.2)
            continue
        end_draw = E - 1.0 - (0.6 if 'bub' in b else 0)
        b['t_draw'] = (t, end_draw)
        if 'bub' in b:
            b['t_bub'] = (end_draw, end_draw + 0.6)
        b['t_exit'] = (E - 1.0, E - 0.55)
        b['t_color'] = (E - 1.0, E - 0.25)
    return blocks, HAND, HAND_TIP, voice_end

# ---------------------------------------------------------------- rendering
def paste_rgba(dst, layer, x, y, alpha_mul=None):
    """alpha-composite float RGBA layer onto float RGB dst at x,y (clipped)."""
    h, w = layer.shape[:2]
    X0, Y0 = max(x, 0), max(y, 0)
    X1, Y1 = min(x + w, dst.shape[1]), min(y + h, dst.shape[0])
    if X1 <= X0 or Y1 <= Y0:
        return
    l = layer[Y0 - y:Y1 - y, X0 - x:X1 - x]
    a = l[..., 3:4] / 255
    if alpha_mul is not None:
        a = a * alpha_mul[Y0 - y:Y1 - y, X0 - x:X1 - x, None]
    d = dst[Y0:Y1, X0:X1]
    d[:] = d * (1 - a) + l[..., :3] * a

def draw_polyline(dst, pts, frac, offy, width=7):
    n = max(2, int(len(pts) * frac))
    if frac <= 0:
        return None
    im = Image.fromarray(np.zeros((dst.shape[0], dst.shape[1]), np.uint8))
    d = ImageDraw.Draw(im)
    p = [(x, y - offy) for x, y in pts[:n]]
    d.line(p, fill=255, width=width, joint='curve')
    a = np.asarray(im).astype(np.float32)[..., None] / 255
    dst[:] = dst * (1 - a) + 25 * a
    return p[-1]

def render_block(b, t, out, offy):
    """Render block b's dynamic content at time t into out (screen array), board y offset offy.
    Returns hand tip (screen coords) or None, and whether the pen is drawing."""
    tip, drawing = None, False
    # title (wipe left -> right)
    t0, t1 = b['t_title']
    if t >= t0:
        f = clamp01((t - t0) / (t1 - t0))
        tl = b['title_l']
        cut = int(tl.shape[1] * f)
        if cut > 0:
            paste_rgba(out, tl[:, :cut], b['tx'], b['ty'] - offy)
        if f < 1:
            tip = (b['tx'] + cut, b['ty'] - offy + tl.shape[0] * (0.55 + 0.18 * math.sin(f * 40)))
            drawing = True
    if b.get('ink') is None:  # end card
        f0, f1 = b['t_frame']
        if t >= f0:
            f = clamp01((t - f0) / (f1 - f0))
            p = draw_polyline(out, b['frame'], f, offy, 8)
            if f < 1 and p:
                tip, drawing = p, True
        p0, p1 = b['t_photo']
        if t >= p0:
            a = ease((t - p0) / (p1 - p0))
            y0 = b['iy'] - offy
            seg = out[y0:y0 + b['h'], b['ix']:b['ix'] + b['w']]
            seg[:] = seg * (1 - a) + b['img'][:seg.shape[0]] * a
        return tip, drawing
    d0, d1 = b['t_draw']
    if t >= d0:
        p = clamp01((t - d0) / (d1 - d0))
        p = 0.5 * p + 0.5 * (1 - (1 - p) ** 2) if p < 1 else 1.0  # slight ease-out
        img = b['img']
        lines_v = img.max(2, keepdims=True)  # graphite version of the drawing
        lines = np.repeat(lines_v, 3, 2)
        a = (b['ink'] * (b['order'] <= p))[..., None]
        blk = 255 * (1 - a) + lines * a
        c0, c1 = b['t_color']
        if t >= c0:
            ca = ease((t - c0) / (c1 - c0))
            blk = blk * (1 - ca) + img * ca
        y0 = b['iy'] - offy
        hh = blk.shape[0]
        Y0, Y1 = max(y0, 0), min(y0 + hh, out.shape[0])
        if Y1 > Y0:
            seg = out[Y0:Y1, b['ix']:b['ix'] + b['w']]
            seg[:] = np.minimum(seg, blk[Y0 - y0:Y1 - y0])
        if 0 < p < 1:
            seq = b['seq']
            n = len(seq)
            k1 = int(p * (n - 1))
            k0 = max(0, k1 - max(3, n // 600))
            pt = seq[k0:k1 + 1].mean(0)
            tip = (b['ix'] + pt[0], b['iy'] + pt[1] - offy)
            drawing = True
    if 'bub' in b:
        bb = b['bub']
        u0, u1 = b['t_bub']
        if t >= u0:
            f = clamp01((t - u0) / ((u1 - u0) * 0.6))
            p = draw_polyline(out, bb['path'], f, offy, 6)
            if f < 1 and p:
                tip, drawing = p, True
            g = clamp01((t - u0 - (u1 - u0) * 0.6) / ((u1 - u0) * 0.4))
            if g > 0:
                tl = bb['text']
                cut = int(tl.shape[1] * g)
                if cut > 0:
                    paste_rgba(out, tl[:, :cut], bb['tx'], bb['ty'] - offy)
                if g < 1:
                    tip, drawing = (bb['tx'] + cut, bb['ty'] - offy + tl.shape[0] * 0.6), True
    return tip, drawing

class Hand:
    OFF = (760.0, H + 650.0)

    def __init__(self, HAND, tip):
        self.img, self.tip = HAND, tip
        self.pos = np.array(self.OFF)

    def update(self, target, k=0.55):
        target = np.array(target, float)
        self.pos = self.pos + (target - self.pos) * k
        return self.pos

    def draw(self, out, pos):
        x, y = int(pos[0] - self.tip[0]), int(pos[1] - self.tip[1])
        # soft shadow
        sh = self.img.copy(); sh[..., :3] = 0; sh[..., 3] *= 0.18
        paste_rgba(out, sh, x + 18, y + 22)
        paste_rgba(out, self.img, x, y)

# ---------------------------------------------------------------- subtitles
def make_chunks(words):
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        txt = w['w']
        if len(cur) >= 4 or txt[-1] in '.?!:,…' or (len(cur) >= 3 and len(' '.join(x['w'] for x in cur)) > 14):
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    out = []
    for i, c in enumerate(chunks):
        s = c[0]['s']
        e = c[-1]['e']
        nxt = chunks[i + 1][0]['s'] if i + 1 < len(chunks) else e + 0.4
        out.append(dict(words=c, s=s, e=min(nxt, e + 0.5)))
    return out

def clean(w):
    w = w.replace('…', '').rstrip('.,:').replace(' :', '')
    return w.upper()

SUB_FONT = {}
def sub_font(size):
    if size not in SUB_FONT:
        SUB_FONT[size] = ImageFont.truetype(F_SUB, size)
    return SUB_FONT[size]

def draw_subs(out, chunks, t):
    ch = next((c for c in chunks if c['s'] <= t < c['e']), None)
    if not ch:
        return
    toks = [clean(w['w']) for w in ch['words']]
    size = 78
    while True:
        f = sub_font(size)
        sp = f.getlength(' ') * 1.5
        widths = [f.getlength(x) for x in toks]
        total = sum(widths) + sp * (len(toks) - 1)
        if total <= 960 or size <= 50:
            break
        size -= 4
    # appear with a tiny pop
    im = Image.new('RGBA', (W, 220), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    started = [w for w in ch['words'] if w['s'] - 0.04 <= t]
    cur = started[-1] if started else None
    for stroke in (True, False):
        x = (W - total) / 2
        for w, tok, wd in zip(ch['words'], toks, widths):
            col = SUB_ACTIVE if w is cur else (255, 255, 255)
            if stroke:
                d.text((x, 110), tok, font=f, fill=(0, 0, 0, 255), anchor='lm', stroke_width=9, stroke_fill=(0, 0, 0, 255))
            else:
                d.text((x, 110), tok, font=f, fill=col + (255,), anchor='lm')
            x += wd + sp
    paste_rgba(out, np.asarray(im).astype(np.float32), 0, 1730 - 110)

# ---------------------------------------------------------------- frame
def make_frame(t, blocks, hand, chunks, total_h):
    # camera
    cam = blocks[0]['cam']
    for b in blocks[1:]:
        s0, s1 = b['slide']
        if t >= s0:
            prev = cam
            cam = prev + (b['cam'] - prev) * ease((t - s0) / (s1 - s0))
    cam = int(round(cam))
    out = np.full((H, W, 3), 255, np.float32)
    tip, drawing = None, False
    for b in blocks:
        if b['top'] + TITLE_H + b['h'] < cam or b['top'] > cam + H:
            continue
        if t < b['t_title'][0]:
            continue
        r = render_block(b, t, out, cam)
        if b['T0'] <= t < b['E'] and t < b['t_exit'][0]:
            tip, drawing = r
            active = b
    # hand
    if tip is not None:
        pos = hand.update(tip, 0.6)
    else:
        pos = hand.update(Hand.OFF, 0.22)
    if pos[1] - hand.tip[1] < H:
        hand.draw(out, pos)
    draw_subs(out, chunks, t)
    return np.clip(out, 0, 255).astype(np.uint8), drawing

def main():
    words = json.load(open(os.path.join(HERE, 'words.json')))
    blocks, HAND, TIP, voice_end = build(words)
    chunks = make_chunks(words)
    total = blocks[-1]['E']
    hand = Hand(HAND, TIP)
    mode = sys.argv[1] if len(sys.argv) > 1 else 'video'
    nfr = int(math.ceil(total * FPS))
    if mode == 'preview':
        want = sorted(float(x) for x in sys.argv[2:])
        os.makedirs(os.path.join(HERE, 'preview'), exist_ok=True)
        for i in range(nfr):
            t = i / FPS
            if not want:
                break
            fr, _ = make_frame(t, blocks, hand, chunks, total)
            if t >= want[0] - 1e-6:
                Image.fromarray(fr).save(os.path.join(HERE, 'preview', f'f_{t:06.2f}.png'))
                want.pop(0)
        return
    print('duration', total, 'frames', nfr, flush=True)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                            '-pix_fmt', 'yuv420p', os.path.join(HERE, 'video_noaudio.mp4')], stdin=subprocess.PIPE)
    act = []
    for i in range(nfr):
        fr, drawing = make_frame(i / FPS, blocks, hand, chunks, total)
        act.append(1 if drawing else 0)
        enc.stdin.write(fr.tobytes())
        if i % 150 == 0:
            print('frame', i, flush=True)
    enc.stdin.close(); enc.wait()
    json.dump(dict(fps=FPS, act=act, total=total), open(os.path.join(HERE, 'activity.json'), 'w'))

if __name__ == '__main__':
    main()
