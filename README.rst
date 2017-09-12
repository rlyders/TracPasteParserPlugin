.. image:: https://github.com/rlyders/TracTicketFieldParserPlugin/docs/_static/TracTicketFieldParserPlugin-Logo.png
   :alt: TracTicketFieldParserPlugin Logo

   ==================================
TracTicketFieldParserPlugin: Configurable JavaScript-based parser/populator for Trac tickets.
==================================

.. teaser-begin

``TracTicketFieldParserPlugin`` is a Trac plugin that is triggered by a text string of key/values pairs pasted into a designated Trac ticket field. The pasted text is parsed into an array of key/value pairs using flexible configuration rules defined in the trac.ini. The array of key/value pairs can be transformed via JavaScript code defined in trac.ini. The final value of each key/value pair is mapped to Trac ticket fields based on the cross-reference defined in trac.ini. The designated Trac ticket fields are then populated with the final values. 

The end result is that a user can auto-populate any number of Trac ticker fields simply by pasting a string of key/value pairs into a Trac ticket field, such as the description field. 

The original inspiration for this plugin came from the realization that users were creating Trac tickets by manually copying various data elements from the body of an auto-generated email. 

This plugin is somewhat of a stop-gap solution as my real goal is to have Trac read those auto-generated emails directly and automatically parse them into new tickets in Trac. However, the nice aspect of having this existing plugin work completely on the client-side in front of an active user is that the user can very easily correct any errors right there in the Trac ticket web page if something goes wrong. This existing client-side solution avoids the risk of a number of tickets being created with data errors or tickets failing to be created because the incoming data format changed or included unexpected data. The email integration could be more automated, but would require more robust error handling, some kind of interface for administration, and a way to deal with failures.

.. -spiel-end-

Pleas see the provided trac.ini.sample that contains an excerpt of a trac.ini file showing you a full-functioning configuration for TracTicketFieldParserPlugin.

.. -end-

.. -project-information-

Project Information
===================

``TracTicketFieldParserPlugin`` is released under the `MIT <https://choosealicense.com/licenses/mit/>`_ license,
and the code is on `GitHub <https://github.com/rlyders/TracTicketFieldParserPlugin/>`_.
It’s tested running under Python 2.7 in the the following browsers: IE 11, Chrome 60.0, and Firefox 54.0.
