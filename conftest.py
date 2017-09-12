from __future__ import absolute_import, division, print_function

import pytest

@pytest.fixture(scope="session")
def newPasteParser():
    """
    Return an object instance of a PasteParser class
    """
    
    from PasteParser import PasteParser
    
    tfp = PasteParser()
    return tfp
