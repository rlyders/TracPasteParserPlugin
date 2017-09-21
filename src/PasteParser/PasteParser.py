# -*- coding: utf-8 -*-
#
# Copyright (C) 2017 Richard Lyders <Richard@Lyders.com>
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 
#  1. Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer.
#  2. Redistributions in binary form must reproduce the above copyright
#     notice, this list of conditions and the following disclaimer in
#     the documentation and/or other materials provided with the
#     distribution.
#  3. The name of the author may not be used to endorse or promote
#     products derived from this software without specific prior
#     written permission.
# 
# THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS
# OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
# GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
# IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
# OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN
# IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#

from trac.core import Component, implements
from trac.config import ConfigSection, Option
from trac.web.api import IRequestFilter
from trac.web.chrome import ITemplateProvider, add_script, add_script_data
import json
 
SCRIPT_VARIABLE_NAME = 'paste_parser_config'

class PasteParser(Component):

    implements(IRequestFilter, ITemplateProvider)

    paste_parser_section = ConfigSection('paste-parser',
        """ When text is pasted into the designated field of a new ticket
            this plugin can parse that pasted text and populate the results
            into other ticket fields as defined by these configuration options.
            This is useful where ticket information is received via email in a 
            very structured format that can be parsed. Users can copy-paste the email
            into one text field of a new ticket and then that pasted text will
            instantly be parsed and populated into the appropriate ticket fields for
            the user to review and adjust as needed before saving. 
        """)

    paste_parser_xref_section = ConfigSection('paste-parser-xref',
        """ These section contains all the information related to the fields that 
        should be searched for in the pasted text.
        """)

    pasted_text_pattern = Option('paste-parser', 'pasted_text_pattern',
        doc="""This is the regular expression pattern that this plugin will
               attempt to match against the text pasted into the designated field of a new 
               ticket. If this pattern does not find a match within the pasted text, then 
               nothing happens. If this pattern matches all or part of what was
               pasted into the designated field of a new ticket, then this plugin will immediately
               attempt to parse the matched text based on the the definitions in 
               this config and populate the resulting values into the related ticket fields.""")

    field_not_found_for_updating_label = Option('paste-parser', 'field_not_found_for_updating_label',
        doc="""Label inserted into the paste-field to identify fields that could not be found in the DOM to be updated.""")

    invalid_field_values_not_in_list_label = Option('paste-parser', 'invalid_field_values_not_in_list_label',
        doc="""Label inserted into the paste-field to identify field values that could not be assigned because the value is not in the defined SELECT list of OPTIONS.""")

    key_value_delimiter = Option('paste-parser', 'key_value_delimiter',
        doc="""This is the delimiter that will be appended to all given 'source_key' strings (the source line attribute label)
        when attempting to match field labels in the pasted designated field text.""")

    ignore_pattern = Option('paste-parser', 'ignore_pattern',
        doc="""This is the regular expression that defines which strings within the 
        pasted text should be ignored/skipped and not be parsed for key-values These strings
        are stripped out of the input string prior to processing.""")

    field_to_parse = Option('paste-parser', 'field_to_parse',
        doc="""This is the name of the ticket field to be parsed. To get the actual DOM element for this field,
        this field name will be converted to the ID of the field's DOM element via a regexp replace
        with the field_name_to_id_match as the match pattern and the field_name_to_id_replace as the
        replacement pattern.""")

    field_name_to_id_match = Option('paste-parser', 'field_name_to_id_match',
        doc="""This is a regexp matching pattern that will be used to match against the designated field name
        and then the field_name_to_id_replace will be used as the replacement pattern 
        to convert the field name to an ID so that we can get the actual DOM element for this field.""")

    field_name_to_id_replace = Option('paste-parser', 'field_name_to_id_replace',
        doc="""This is a regexp replacement pattern that will be used in conjunction with the field_name_to_id_match
        to convert the field name to an ID so that we can get the actual DOM element for this field.""")

    key_value_end_pattern = Option('paste-parser', 'key_value_end_pattern',
        doc="""This optional regexp matching pattern defines the end of each key/value pair. If not given, a new line 
        determines the end. This is useful if values span multiple lines.""")

    debug_on = Option('paste-parser', 'debug_on',
        doc="""If set to true, extensive debugging will be sent to the browser's console.""")


    def _get_xref(self):
        """Returns a list of dict describing the config options from trac.ini
           that define how to parse the pasted designated field text.
           Based on _get_ticket_groups() from Trac v1.2 trac/ticket/roadmap.py
        """
        if 'paste-parser-xref' in self.config:
            xrefs = {}
            order = 0
            for field_name, value in self.paste_parser_xref_section.options():
                qualifier = 'regexp' 
                if '.' in field_name:
                    field_name, qualifier = field_name.split('.', 1)
                self.log.debug("[PasteParser] field_name=%s qualifier=%s", field_name, qualifier)
                field = xrefs.setdefault(field_name, {'name': field_name,
                                                      'order': order})
                self.log.debug('[PasteParser] json.dumps(field) PRE='+json.dumps(field))
                field[qualifier] = value
                self.log.debug('[PasteParser] json.dumps(field) POST='+json.dumps(field))
                order = max(order, int(field['order'])) + 1
            self.log.debug('[PasteParser] json.dumps(xrefs)='+json.dumps(xrefs))
            return [field for field in sorted(xrefs.values(),
                                              key=lambda g: int(g['order']))]
        else:
            return None


    # IRequestFilter methods

    def pre_process_request(self, req, handler):
        return handler

    def post_process_request(self, req, template, data, content_type):
        if template == 'ticket.html' and req.path_info == '/newticket':
            add_script(req, 'PasteParser/js/PasteParser.js')
            
            paste_parser_config = { 
                'pasted_text_pattern':      self.pasted_text_pattern,
                'key_value_delimiter':      self.key_value_delimiter,
                'ignore_pattern':           self.ignore_pattern,
                'field_to_parse':           self.field_to_parse,
                'field_name_to_id_match':   self.field_name_to_id_match,
                'field_name_to_id_replace': self.field_name_to_id_replace,
                'key_value_end_pattern':    self.key_value_end_pattern,                
                'field_not_found_for_updating_label':    self.field_not_found_for_updating_label,                
                'invalid_field_values_not_in_list_label':    self.invalid_field_values_not_in_list_label,                
                'debug_on': self.debug_on,
                'xrefs': self._get_xref()
                }
            self.log.debug('[PasteParser] json.dumps(paste_parser_config)='+json.dumps(paste_parser_config));
            add_script_data(req, {SCRIPT_VARIABLE_NAME: paste_parser_config})

        return template, data, content_type

    # ITemplateProvider methods

    def get_htdocs_dirs(self):
        from pkg_resources import resource_filename
        return [('PasteParser', resource_filename(__name__, 'htdocs'))]

    def get_templates_dirs(self):
        return []

    # Private methods

