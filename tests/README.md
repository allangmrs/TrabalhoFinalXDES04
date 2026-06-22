# Testes Selenium – Sistema de Biblioteca

Testes automatizados para os 4 CRUDs (Usuários, Autores, Editoras, Livros)
do sistema gerado no Lovable.

## 1. Instalação

```bash
pip install -r requirements.txt
```

Requer **Google Chrome** instalado na máquina (o `webdriver-manager` baixa
o ChromeDriver compatível automaticamente).

## 2. Configuração — IMPORTANTE

Abra o arquivo `config.py` e troque a `BASE_URL` pela URL real do seu
projeto publicado no Lovable:

```python
BASE_URL = "https://seu-projeto.lovable.app"
```

Se as rotas do seu app forem diferentes de `/usuarios`, `/autores`,
`/editoras`, `/livros`, ajuste o dicionário `ROTAS` também em `config.py`.

No arquivo `test_livros.py`, ajuste também:

```python
AUTOR_EXISTENTE = "Machado de Assis"      # troque por um autor já cadastrado
EDITORA_EXISTENTE = "Companhia das Letras" # troque por uma editora já cadastrada
```

## 3. Rodando os testes

Todos os testes:
```bash
pytest -v
```

Só um CRUD específico:
```bash
pytest test_usuarios.py -v
pytest test_autores.py -v
pytest test_editoras.py -v
pytest test_livros.py -v
```

Só um teste específico:
```bash
pytest test_usuarios.py::test_cadastrar_usuario -v
```

Rodar sem abrir a janela do navegador (headless): descomente a linha
`# options.add_argument("--headless=new")` em `conftest.py`.

## 4. Se algum teste falhar por seletor incorreto

Os helpers em `helpers.py` buscam elementos por **label** (texto ao lado
do campo) ou por **texto do botão**. Como cada app gerado pelo Lovable
pode ter nomes de label levemente diferentes do que o documento de
requisitos descreve, alguns ajustes podem ser necessários:

1. Abra o app no Chrome → F12 → Inspecionar elemento no campo que falhou
2. Veja o texto exato da `<label>` ou o `placeholder` do input
3. Ajuste a chamada correspondente no arquivo de teste (ex: troque
   `"Data de Nascimento"` por `"Nascimento"` se for esse o texto real)

Para campos `<Select>` (Nacionalidade, País, Categoria, Autor, Editora,
Status), o helper `selecionar_opcao_select_shadcn` espera um elemento
com `role="combobox"` próximo ao label e opções com `role="option"`
quando o menu abre — esse é o padrão do shadcn/ui usado pelo Lovable.
Se seu app usa um `<select>` HTML nativo, me avise para eu trocar o helper.

## 5. Ordem recomendada de execução

Como o teste de Livros depende de já existir autor/editora cadastrados:

```bash
pytest test_autores.py test_editoras.py test_usuarios.py test_livros.py -v
```

## Estrutura dos arquivos

```
config.py          → URL base e rotas
helpers.py          → funções reutilizáveis (preencher campo, clicar botão, etc.)
conftest.py          → fixture do driver Selenium (abre/fecha o Chrome)
test_usuarios.py     → cadastro, CPF duplicado, edição, status padrão
test_autores.py      → cadastro, nome duplicado, exclusão
test_editoras.py     → cadastro, nome+CNPJ duplicado, exclusão
test_livros.py       → cadastro, ISBN duplicado, edição, exclusão
```
