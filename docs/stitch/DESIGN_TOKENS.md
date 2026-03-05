# DESIGN_TOKENS (AGENTS v3.0 Alinhado)

## 1) Temas canônicos

### 1.1 `dark_core`
```css
--bg: #080F0B;
--bg2: #0C1510;
--card: #121A14;
--border: #1C2E20;

--mint: #52B788;
--mintl: #74C9A0;
--gold: #C4A35A;

--ivory: #EDE7D9;
--ivoryD: #C8BFA8;
--ivoryDD: #8A8070;

--red: #B85450;
--blue: #4A8FA8;
```

### 1.2 `dark_theater` (S03)
- herda `dark_core`;
- fundo de palco `#000000`;
- overlay gradiente para manter legibilidade;
- painel inferior com blur e borda `--border`.

### 1.3 `light_onboard` (S08, S16)
```css
body: #FCFCFC;
text-main: #1A1A1A;
input-border: #E5E7EB;
focus: #52B788;
```

### 1.4 `light_patient` (S10, S17, S23-S25)
```css
body: #F8F9FA;
card: #FFFFFF;
border: #E2E8F0;
primary: #4A8FA8;
primary-hover: #3B7489;
text-main: #2D3748;
text-muted: #718096;
```

## 2) Tipografia oficial (imutável)
- Display: `Cormorant Garamond`
- Body/UI: `Instrument Sans`

## 3) Mapeamento para tokens semânticos do app
- `--bg` -> `--color-bg-base`
- `--bg2` -> `--color-bg-elevated`
- `--card` -> `--color-surface`
- `--border` -> `--color-border-subtle`
- `--mint` -> `--color-brand`
- `--mintl` -> `--color-brand-hover`
- `--gold` -> `--color-gold`
- `--ivory` -> `--color-text-primary`
- `--ivoryD` -> `--color-text-secondary`
- `--ivoryDD` -> `--color-text-muted`

## 4) Guardrails
1. Em TSX: proibido usar tokens legados (`--ff`, `--fs`, `--ivory`, `--mint`, `--gold`, `--card`, `--bg`).
2. Sem fontes fora do contrato canônico.
3. `style={{...}}` proibido em `app/` e `components/`.
