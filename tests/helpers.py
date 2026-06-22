"""
Funções auxiliares reutilizadas pelos testes.

O app gerado pelo Lovable usa atributos `data-testid` em quase todos os
elementos interativos (inputs, botões, selects). Por isso, priorizamos
seleção por data-testid, que é muito mais estável do que texto/label.
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from config import TIMEOUT


def esperar(driver, segundos=TIMEOUT):
    return WebDriverWait(driver, segundos)


def clicar_testid(driver, testid, timeout=TIMEOUT):
    """Clica em um elemento pelo atributo data-testid, com scroll garantido."""
    elemento = esperar(driver, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{testid}']"))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
    esperar(driver, timeout).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, f"[data-testid='{testid}']"))
    )
    try:
        elemento.click()
    except Exception:
        # fallback: clique via JS se algo estiver cobrindo o elemento
        driver.execute_script("arguments[0].click();", elemento)
    return elemento


def preencher_testid(driver, testid, valor, timeout=TIMEOUT):
    """Limpa e preenche um input/textarea pelo atributo data-testid."""
    campo = esperar(driver, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{testid}']"))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", campo)
    campo.clear()
    campo.send_keys(valor)
    return campo


def selecionar_combobox_testid(driver, testid, opcao_texto, timeout=TIMEOUT):
    """
    Abre um <Select> do shadcn/ui (role=combobox) pelo data-testid do trigger
    e clica na opção com o texto informado.
    """
    trigger = esperar(driver, timeout).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, f"[data-testid='{testid}']"))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", trigger)
    trigger.click()

    xpath_opcao = f"//*[@role='option'][contains(normalize-space(.), '{opcao_texto}')]"
    opcao = esperar(driver, timeout).until(
        EC.element_to_be_clickable((By.XPATH, xpath_opcao))
    )
    opcao.click()


def clicar_botao_por_texto(driver, texto, timeout=TIMEOUT):
    """Fallback: clica no primeiro botão visível que contenha o texto dado."""
    xpath = f"//button[contains(normalize-space(.), '{texto}')]"
    elemento = esperar(driver, timeout).until(
        EC.element_to_be_clickable((By.XPATH, xpath))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
    try:
        elemento.click()
    except Exception:
        driver.execute_script("arguments[0].click();", elemento)
    return elemento


def texto_presente_na_pagina(driver, texto, timeout=TIMEOUT):
    try:
        esperar(driver, timeout).until(
            EC.text_to_be_present_in_element((By.TAG_NAME, "body"), texto)
        )
        return True
    except TimeoutException:
        return False


def elemento_existe(driver, by, valor):
    try:
        driver.find_element(by, valor)
        return True
    except NoSuchElementException:
        return False


def aguardar_modal_fechar(driver, timeout=TIMEOUT):
    """Espera o modal (role=dialog) desaparecer da tela, evitando cliques interceptados."""
    try:
        esperar(driver, timeout).until(
            EC.invisibility_of_element_located((By.CSS_SELECTOR, "[role='dialog']"))
        )
    except TimeoutException:
        pass
