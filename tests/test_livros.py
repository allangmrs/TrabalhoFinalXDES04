"""
Testes do CRUD de Livros.

ATENÇÃO: os data-testid abaixo seguem a mesma convenção confirmada no
módulo de Usuários, mas NÃO foram confirmados diretamente no HTML de
Livros. Se algum teste falhar com NoSuchElementException, inspecione
o modal de Livros (F12) e ajuste os nomes abaixo:
  - input-titulo
  - input-autor (combobox)
  - input-editora (combobox)
  - input-isbn
  - input-categoria (combobox)
  - input-ano
  - input-exemplares
  - btn-salvar-livro

Também assume que já existe pelo menos 1 autor e 1 editora cadastrados
no sistema (rode test_autores.py e test_editoras.py antes, ou ajuste
AUTOR_EXISTENTE / EDITORA_EXISTENTE abaixo para nomes já cadastrados).
"""

import time
from selenium.webdriver.common.by import By

from config import BASE_URL, ROTAS
from helpers import (
    clicar_testid,
    preencher_testid,
    selecionar_combobox_testid,
    clicar_botao_por_texto,
    texto_presente_na_pagina,
    aguardar_modal_fechar,
)

URL_LIVROS = f"{BASE_URL}{ROTAS['livros']}"

SUFIXO = str(int(time.time()))[-4:]
TITULO_TESTE = f"Livro Teste {SUFIXO}"
ISBN_TESTE = f"978-65-{SUFIXO}-000-0"

# >>> AJUSTE conforme os autores/editoras já cadastrados no seu sistema <<<
AUTOR_EXISTENTE = "Machado de Assis"
EDITORA_EXISTENTE = "Companhia das Letras"


def test_cadastrar_livro(driver):
    driver.get(URL_LIVROS)

    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-titulo", TITULO_TESTE)
    selecionar_combobox_testid(driver, "input-autor", AUTOR_EXISTENTE)
    selecionar_combobox_testid(driver, "input-editora", EDITORA_EXISTENTE)
    preencher_testid(driver, "input-isbn", ISBN_TESTE)
    selecionar_combobox_testid(driver, "input-categoria", "Romance")
    preencher_testid(driver, "input-ano", "2024")
    preencher_testid(driver, "input-exemplares", "5")
    clicar_testid(driver, "btn-salvar-livro")
    aguardar_modal_fechar(driver)

    assert texto_presente_na_pagina(driver, TITULO_TESTE), (
        "Livro cadastrado não apareceu na listagem"
    )


def test_isbn_duplicado_deve_bloquear_cadastro(driver):
    driver.get(URL_LIVROS)

    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-titulo", f"Outro Titulo {SUFIXO}")
    selecionar_combobox_testid(driver, "input-autor", AUTOR_EXISTENTE)
    selecionar_combobox_testid(driver, "input-editora", EDITORA_EXISTENTE)
    preencher_testid(driver, "input-isbn", ISBN_TESTE)  # ISBN repetido
    selecionar_combobox_testid(driver, "input-categoria", "Ficção Científica")
    preencher_testid(driver, "input-ano", "2023")
    preencher_testid(driver, "input-exemplares", "2")
    clicar_testid(driver, "btn-salvar-livro")

    # Ajuste o texto abaixo conforme a mensagem exata exibida pelo seu app
    assert texto_presente_na_pagina(driver, "ISBN"), (
        "Mensagem de erro sobre ISBN duplicado não foi exibida"
    )


def test_editar_livro(driver):
    driver.get(URL_LIVROS)

    linha = driver.find_element(By.XPATH, f"//tr[contains(., '{TITULO_TESTE}')]")
    botao_editar = linha.find_element(By.XPATH, ".//button[starts-with(@data-testid, 'edit-')]")
    livro_id = botao_editar.get_attribute("data-testid").replace("edit-", "")

    clicar_testid(driver, f"edit-{livro_id}")

    novo_titulo = f"{TITULO_TESTE} Editado"
    preencher_testid(driver, "input-titulo", novo_titulo)
    clicar_testid(driver, "btn-salvar-livro")
    aguardar_modal_fechar(driver)

    assert texto_presente_na_pagina(driver, novo_titulo), (
        "Título editado não apareceu na listagem"
    )


def test_excluir_livro_sem_historico(driver):
    driver.get(URL_LIVROS)

    titulo_exclusao = f"Livro Exclusao {SUFIXO}"
    isbn_exclusao = f"978-65-{SUFIXO}-111-1"

    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-titulo", titulo_exclusao)
    selecionar_combobox_testid(driver, "input-autor", AUTOR_EXISTENTE)
    selecionar_combobox_testid(driver, "input-editora", EDITORA_EXISTENTE)
    preencher_testid(driver, "input-isbn", isbn_exclusao)
    selecionar_combobox_testid(driver, "input-categoria", "Aventura")
    preencher_testid(driver, "input-ano", "2022")
    preencher_testid(driver, "input-exemplares", "1")
    clicar_testid(driver, "btn-salvar-livro")
    aguardar_modal_fechar(driver)

    linha = driver.find_element(By.XPATH, f"//tr[contains(., '{titulo_exclusao}')]")
    botao_excluir = linha.find_element(By.XPATH, ".//button[starts-with(@data-testid, 'delete-')]")
    livro_id = botao_excluir.get_attribute("data-testid").replace("delete-", "")

    clicar_testid(driver, f"delete-{livro_id}")

    try:
        clicar_botao_por_texto(driver, "Confirmar", timeout=3)
    except Exception:
        pass

    assert not texto_presente_na_pagina(driver, titulo_exclusao, timeout=3), (
        "Livro não foi removido da listagem após exclusão"
    )
