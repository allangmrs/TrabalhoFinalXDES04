"""
Configurações gerais dos testes.
>>> AJUSTE A BASE_URL ABAIXO PARA A URL DO SEU PROJETO NO LOVABLE <<<
"""

BASE_URL = "https://xdeslib.lovable.app"  # <-- TROQUE AQUI

# Caminhos das telas (ajuste se as rotas do seu app forem diferentes)
ROTAS = {
    "usuarios": "/usuarios",
    "autores": "/autores",
    "editoras": "/editoras",
    "livros": "/livros",
}

# Tempo máximo de espera (segundos) para elementos aparecerem
TIMEOUT = 10
