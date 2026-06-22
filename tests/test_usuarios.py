"""
Testes do CRUD de Usuários.

Seletores baseados nos data-testid reais do app (confirmados via inspeção
do HTML): input-nome, input-cpf, input-nascimento, input-telefone,
input-email, input-endereco, input-status, btn-salvar-usuario,
edit-{id}, delete-{id}.
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

URL_USUARIOS = f"{BASE_URL}{ROTAS['usuarios']}"

SUFIXO = str(int(time.time()))[-4:]
CPF_TESTE = f"123.456.{SUFIXO}-00"
NOME_TESTE = f"Usuario Teste {SUFIXO}"


def test_cadastrar_usuario(driver):
    driver.get(URL_USUARIOS)

    clicar_botao_por_texto(driver, "Novo")

    preencher_testid(driver, "input-nome", NOME_TESTE)
    preencher_testid(driver, "input-cpf", CPF_TESTE)
    preencher_testid(driver, "input-nascimento", "15/03/1995")
    preencher_testid(driver, "input-telefone", "(11)98765-4321")
    preencher_testid(driver, "input-email", f"teste{SUFIXO}@email.com")
    preencher_testid(driver, "input-endereco", "Rua das Flores, 123")

    clicar_testid(driver, "btn-salvar-usuario")
    aguardar_modal_fechar(driver)

    assert texto_presente_na_pagina(driver, NOME_TESTE), (
        "Usuário cadastrado não apareceu na listagem"
    )


def test_cpf_duplicado_deve_bloquear_cadastro(driver):
    driver.get(URL_USUARIOS)

    # Primeiro cadastro
    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", f"Primeiro {SUFIXO}")
    preencher_testid(driver, "input-cpf", CPF_TESTE)
    preencher_testid(driver, "input-nascimento", "01/01/1990")
    preencher_testid(driver, "input-telefone", "(11)90000-0000")
    preencher_testid(driver, "input-email", f"primeiro{SUFIXO}@email.com")
    preencher_testid(driver, "input-endereco", "Rua A, 1")
    clicar_testid(driver, "btn-salvar-usuario")
    aguardar_modal_fechar(driver)

    # Segundo cadastro com o MESMO CPF
    clicar_botao_por_texto(driver, "Novo")
    preencher_testid(driver, "input-nome", f"Segundo {SUFIXO}")
    preencher_testid(driver, "input-cpf", CPF_TESTE)  # CPF repetido de propósito
    preencher_testid(driver, "input-nascimento", "02/02/1991")
    preencher_testid(driver, "input-telefone", "(11)91111-1111")
    preencher_testid(driver, "input-email", f"segundo{SUFIXO}@email.com")
    preencher_testid(driver, "input-endereco", "Rua B, 2")
    clicar_testid(driver, "btn-salvar-usuario")

    # Mensagem exata exibida pelo sistema
    assert texto_presente_na_pagina(driver, "CPF já cadastrado no sistema"), (
        "Mensagem de erro sobre CPF duplicado não foi exibida"
    )


def test_editar_usuario(driver):
    driver.get(URL_USUARIOS)

    clicar_botao_por_texto(driver, "Novo")
    nome_original = f"Editar Original {SUFIXO}"
    preencher_testid(driver, "input-nome", nome_original)
    preencher_testid(driver, "input-cpf", f"321.654.{SUFIXO}-55")
    preencher_testid(driver, "input-nascimento", "20/05/1992")
    preencher_testid(driver, "input-telefone", "(11)93333-3333")
    preencher_testid(driver, "input-email", f"editar{SUFIXO}@email.com")
    preencher_testid(driver, "input-endereco", "Rua D, 4")
    clicar_testid(driver, "btn-salvar-usuario")
    aguardar_modal_fechar(driver)

    # Localiza a linha pelo nome e descobre o id a partir do data-testid do botão editar
    linha = driver.find_element(By.XPATH, f"//tr[contains(., '{nome_original}')]")
    botao_editar = linha.find_element(By.XPATH, ".//button[starts-with(@data-testid, 'edit-')]")
    user_id = botao_editar.get_attribute("data-testid").replace("edit-", "")

    clicar_testid(driver, f"edit-{user_id}")

    novo_nome = f"{nome_original} Editado"
    preencher_testid(driver, "input-nome", novo_nome)
    clicar_testid(driver, "btn-salvar-usuario")
    aguardar_modal_fechar(driver)

    assert texto_presente_na_pagina(driver, novo_nome), (
        "Nome editado não apareceu na listagem"
    )


def test_status_padrao_ativo_ao_cadastrar(driver):
    driver.get(URL_USUARIOS)
    clicar_botao_por_texto(driver, "Novo")

    nome = f"Status Padrao {SUFIXO}"
    preencher_testid(driver, "input-nome", nome)
    preencher_testid(driver, "input-cpf", f"999.888.{SUFIXO}-11")
    preencher_testid(driver, "input-nascimento", "10/10/2000")
    preencher_testid(driver, "input-telefone", "(11)92222-2222")
    preencher_testid(driver, "input-email", f"status{SUFIXO}@email.com")
    preencher_testid(driver, "input-endereco", "Rua C, 3")
    clicar_testid(driver, "btn-salvar-usuario")
    aguardar_modal_fechar(driver)

    linha = driver.find_element(By.XPATH, f"//tr[contains(., '{nome}')]")
    assert "Ativo" in linha.text, "Status padrão não foi 'Ativo'"
