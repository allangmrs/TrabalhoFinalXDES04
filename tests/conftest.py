"""
Fixtures compartilhadas pelo pytest.
"""

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    # Descomente a linha abaixo se quiser rodar sem abrir janela (headless)
    # options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,900")

    service = Service(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=options)
    drv.implicitly_wait(3)

    yield drv

    drv.quit()
