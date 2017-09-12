import pkg_resources
pkg_resources.require('Trac >= 1.2')

__version__ = "1.1.1.dev0"

__title__ = "PasteParser"
__description__ = "This plugin for Trac 1.2+ parses text pasted by the user into the description of a ticket. Triggered off a 'paste' event, this JavaScript parser intercepts the pasted text, parses it, transforms it, and maps it to the appropriate ticket fields based on flexible configuration rules defined in trac.ini. Tested in IE 11, Chrome 60.0, and Firefox 54.0."
__uri__ = "http://lyders.com/"
__doc__ = __description__ + " <" + __uri__ + ">"

__author__ = "Richard Lyders"
__email__ = "Richard@Lyders.com"

__license__ = "MIT"
__copyright__ = "Copyright (c) 2017 Richard Lyders" 
