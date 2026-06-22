"""
Testes do CRUD de Autores.

ATENÇÃO: os data-testid abaixo seguem a mesma convenção confirmada no
módulo de Usuários (input-{campo}, btn-salvar-{entidade}, edit-{id},
delete-{id}), mas NÃO foram confirmados diretamente no HTML de Autores.
Se algum teste falhar com NoSuchElementException, inspecione o modal de
Autores (F12) e ajuste os nomes abaixo:
  - input-nome
  - input-nacionalidade (combobox)
  - input-nascimento
  - btn-salvar-autor
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

URL_AUTORES = f"{BASE_URL}{ROTAS['autores']}"

SUFIXO = str(int(time.time()))[-4:]
NOME_AUTOR = f"Autor Teste {SUFIXO}"


def test_cadastrar_autor(driver):
    driver.get(URL_AUTORES)

    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", NOME_AUTOR)
    selecionar_combobox_testid(driver, "input-nacionalidade", "Brasil")
    preencher_testid(driver, "input-nascimento", "21/06/1980")
    clicar_testid(driver, "btn-salvar-autor")
    aguardar_modal_fechar(driver)

    assert texto_presente_na_pagina(driver, NOME_AUTOR), (
        "Autor cadastrado não apareceu na listagem"
    )


def test_nome_duplicado_deve_bloquear_cadastro(driver):
    driver.get(URL_AUTORES)

    # Tenta cadastrar autor com nome já existente (criado no teste anterior)
    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", NOME_AUTOR)
    selecionar_combobox_testid(driver, "input-nacionalidade", "Portugal")
    preencher_testid(driver, "input-nascimento", "01/01/1970")
    clicar_testid(driver, "btn-salvar-autor")

    # Ajuste o texto abaixo conforme a mensagem exata exibida pelo seu app
    assert texto_presente_na_pagina(driver, "cadastrado no sistema") or texto_presente_na_pagina(
        driver, "já existe"
    ), "Mensagem de erro sobre nome duplicado não foi exibida"


def test_excluir_autor_sem_livros_associados(driver):
    driver.get(URL_AUTORES)

    nome_exclusao = f"Autor Exclusao {SUFIXO}"
    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", nome_exclusao)
    selecionar_combobox_testid(driver, "input-nacionalidade", "Argentina")
    preencher_testid(driver, "input-nascimento", "05/05/1985")
    clicar_testid(driver, "btn-salvar-autor")
    aguardar_modal_fechar(driver)

    linha = driver.find_element(By.XPATH, f"//tr[contains(., '{nome_exclusao}')]")
    botao_excluir = linha.find_element(By.XPATH, ".//button[starts-with(@data-testid, 'delete-')]")
    autor_id = botao_excluir.get_attribute("data-testid").replace("delete-", "")

    clicar_testid(driver, f"delete-{autor_id}")

    # Confirma exclusão se houver modal de confirmação
    try:
        clicar_botao_por_texto(driver, "Confirmar", timeout=3)
    except Exception:
        pass

    assert not texto_presente_na_pagina(driver, nome_exclusao, timeout=3), (
        "Autor não foi removido da listagem após exclusão"
    )
