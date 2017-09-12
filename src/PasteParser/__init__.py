import pkg_resources
pkg_resources.require('Trac >= 1.2')

__version__ = "1.1.1.dev0"

__title__ = "PasteParser"
__description__ = "Plugin for Trac 1.2+ that intercepts pasted text, parses it into key/value pairs, transforms the values via regex and JavaScript, and populates fields with those values. Flexible configuration rules defined in trac.ini allow a lot of customization. Tested in IE 11, Chrome 60.0, and Firefox 54.0."
__uri__ = "https://github.com/rlyders/TracPasteParserPlugin"
__doc__ = __description__ + " <" + __uri__ + ">"

__author__ = "Richard Lyders"
__email__ = "Richard@Lyders.com"

__license__ = "MIT"
__copyright__ = "Copyright (c) 2017 Richard Lyders" 
