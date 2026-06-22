"""
Testes do CRUD de Editoras.

ATENÇÃO: os data-testid abaixo seguem a mesma convenção confirmada no
módulo de Usuários, mas NÃO foram confirmados diretamente no HTML de
Editoras. Se algum teste falhar com NoSuchElementException, inspecione
o modal de Editoras (F12) e ajuste os nomes abaixo:
  - input-nome
  - input-cnpj
  - input-pais (combobox)
  - btn-salvar-editora
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

URL_EDITORAS = f"{BASE_URL}{ROTAS['editoras']}"

SUFIXO = str(int(time.time()))[-4:]
NOME_EDITORA = f"Editora Teste {SUFIXO}"
CNPJ_TESTE = f"12.345.{SUFIXO}/0001-99"


def test_cadastrar_editora(driver):
    driver.get(URL_EDITORAS)

    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", NOME_EDITORA)
    preencher_testid(driver, "input-cnpj", CNPJ_TESTE)
    selecionar_combobox_testid(driver, "input-pais", "Brasil")
    clicar_testid(driver, "btn-salvar-editora")
    aguardar_modal_fechar(driver)

    assert texto_presente_na_pagina(driver, NOME_EDITORA), (
        "Editora cadastrada não apareceu na listagem"
    )


def test_nome_e_cnpj_duplicados_deve_bloquear_cadastro(driver):
    driver.get(URL_EDITORAS)

    # Mesmo nome E mesmo CNPJ do teste anterior
    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", NOME_EDITORA)
    preencher_testid(driver, "input-cnpj", CNPJ_TESTE)
    selecionar_combobox_testid(driver, "input-pais", "Brasil")
    clicar_testid(driver, "btn-salvar-editora")

    # Ajuste o texto abaixo conforme a mensagem exata exibida pelo seu app
    assert texto_presente_na_pagina(driver, "cadastrad") or texto_presente_na_pagina(
        driver, "já existe"
    ), "Mensagem de erro sobre editora duplicada não foi exibida"


def test_excluir_editora_sem_livros_associados(driver):
    driver.get(URL_EDITORAS)

    nome_exclusao = f"Editora Exclusao {SUFIXO}"
    cnpj_exclusao = f"99.888.{SUFIXO}/0001-11"

    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", nome_exclusao)
    preencher_testid(driver, "input-cnpj", cnpj_exclusao)
    selecionar_combobox_testid(driver, "input-pais", "Portugal")
    clicar_testid(driver, "btn-salvar-editora")
    aguardar_modal_fechar(driver)

    linha = driver.find_element(By.XPATH, f"//tr[contains(., '{nome_exclusao}')]")
    botao_excluir = linha.find_element(By.XPATH, ".//button[starts-with(@data-testid, 'delete-')]")
    editora_id = botao_excluir.get_attribute("data-testid").replace("delete-", "")

    clicar_testid(driver, f"delete-{editora_id}")

    try:
        clicar_botao_por_texto(driver, "Confirmar", timeout=3)
    except Exception:
        pass

    assert not texto_presente_na_pagina(driver, nome_exclusao, timeout=3), (
        "Editora não foi removida da listagem após exclusão"
    )
