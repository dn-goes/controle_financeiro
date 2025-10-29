# Controle Financeiro — Protótipo Web & Mobile (Sprint 1)

## Equipe
- Daniel  
- Laiza  
- Gleice

---

## Sobre o projeto
Este repositório contém:
- Um protótipo em Flutter (Sprint 1) — código fornecido separadamente.
- Um pequeno **site estático (HTML + CSS)** que serve como landing / apresentação do app de Controle Financeiro.
- Este `README.md` com instruções de execução e descrição das funcionalidades.

O objetivo do projeto é fornecer uma base funcional para um app de controle financeiro com foco em:
- Registro rápido de receitas e despesas (com marcação de pago/pendente).
- Gestão de contas recorrentes e parcelas.
- Dashboard com balanço mensal, metas e conteúdos de educação financeira.
- Exportação de relatórios (CSV/PDF) e possibilidade de integração futura com OCR e Open Finance.

---

## Arquivos neste pacote web
- `index.html` — Página estática de apresentação (landing page) com navegação para as principais seções: Dashboard, Registrar, Resumo, Metas e Educação.
- `styles.css` — Estilos para a página (`index.html`).
- `README.md` — Este arquivo.

---

## Como usar (site HTML)
1. Descompacte o arquivo ZIP (se aplicável).
2. Abra o arquivo `index.html` em um navegador (duplo clique ou `Ctrl+O` no navegador).
3. A página é estática — todos os links são âncoras internas para demonstrar o layout.

---

## Como rodar o app Flutter (resumo)
> O código Flutter foi entregue separadamente (pasta `lib/` com vários arquivos). Abaixo um guia rápido para rodar o app localmente.

Pré-requisitos:
- Flutter SDK instalado (https://flutter.dev)
- Android Studio / Xcode (opcional, para emuladores)
- Um dispositivo físico ou emulador

Passos:
1. Clone ou copie o projeto para sua máquina.
2. No diretório do projeto, rode:
```bash
flutter pub get
flutter run
```
3. Para web (opcional): `flutter run -d chrome`.

Notas:
- O protótipo usa `provider` para estado e `uuid` para geração de ids.
- Em produção, substitua o armazenamento em memória por uma persistência local (Hive/sembast) ou backend seguro.
- Para autenticação real, use provedores confiáveis (Firebase Auth ou backend com hashing e 2FA).

---

## Recursos futuros / TODOs
- Integrar OCR (captura de recibo) usando `image_picker` + `tesseract_ocr` ou serviço na nuvem.
- Integrar Open Finance com fluxo de consentimento e conformidade LGPD.
- Persistência local/offline com Hive e sincronização com backend.
- Gráficos interativos com `fl_chart`.
- Testes unitários e de widget.
- Hardening de segurança (TLS, criptografia em repouso).

---