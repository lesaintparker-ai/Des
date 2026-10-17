import json,difflib,unicodedata,re
asr=json.load(open('asr.json'))['chunks']
# merge tokens starting with ' or -
tok=[]
for c in asr:
    t=c['text']; s,e=c['timestamp']
    if tok and not t.startswith(' '): tok[-1]=[tok[-1][0]+t,tok[-1][1],e]
    else: tok.append([t.strip(),s,e])
# drop stutter "pé nos"
for i in range(len(tok)-1):
    if tok[i] and tok[i][0]=='pé': tok[i]=None; tok[i+1]=None
tok=[t for t in tok if t]
SCRIPT=["Pour toi, c'est quoi le péché ? Beaucoup répondent : faire le mal.",
"Mais depuis Adam, on naît pécheur. Le péché est déjà dans le cœur.",
"Alors on prie plus. On fait le bien… Mais c'est comme essuyer un vase qui déborde.",
"La Loi, c'est un miroir. Elle montre la tache… mais elle ne la lave pas.",
"Alors Jésus est venu. Par son baptême au Jourdain, il a pris tous nos péchés.",
"Puis, sur la croix, il en a payé le prix. Une fois pour toutes.",
"Si tu crois à cette eau et à cet Esprit, ton cœur est lavé. Pour toujours.",
"Tu veux vraiment comprendre ? Écris-moi en message privé.",
"Je t'envoie gratuitement le Livre 1 : Êtes-vous vraiment né de nouveau d'eau et d'Esprit ?"]
def norm(w):
    w=unicodedata.normalize('NFD',w.lower()); w=''.join(c for c in w if unicodedata.category(c)!='Mn')
    return re.sub(r"[^a-z0-9]","",w)
words=[]
for si,line in enumerate(SCRIPT):
    for w in re.findall(r"\S+",line):
        if re.fullmatch(r"[?:!…]",w):
            words[-1]['w']+=' '+w if w in '?:!' else w; continue
        words.append(dict(w=w,scene=si))
A=[norm(w['w']) for w in words]; B=[norm(t[0]) for t in tok]
sm=difflib.SequenceMatcher(None,A,B,autojunk=False)
for tag,i1,i2,j1,j2 in sm.get_opcodes():
    if tag=='equal' or (i2-i1==j2-j1):
        for k in range(i2-i1): words[i1+k]['s'],words[i1+k]['e']=tok[j1+k][1],tok[j1+k][2]
    elif j2>j1:
        s0,e0=tok[j1][1],tok[j2-1][2]; L=[len(A[i])+1 for i in range(i1,i2)]; tot=sum(L); acc=s0
        for k,i in enumerate(range(i1,i2)):
            d=(e0-s0)*L[k]/tot; words[i]['s']=round(acc,3); acc+=d; words[i]['e']=round(acc,3)
        print('interp',[w['w'] for w in words[i1:i2]],'<-',[t[0] for t in tok[j1:j2]])
assert all('s' in w for w in words), [w for w in words if 's' not in w]
json.dump(words,open('words.json','w'),ensure_ascii=False,indent=0)
for si in range(len(SCRIPT)):
    ws=[w for w in words if w['scene']==si]; print(si+1, ws[0]['s'], ws[-1]['e'], ' '.join(w['w'] for w in ws))
