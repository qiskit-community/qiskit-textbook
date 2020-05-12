#!/usr/bin/env python3
from io import BytesIO
from scour import scour
from time import time

import ipywidgets as widgets


class _pre():

    def __init__(self, value=''):
        self.widget = widgets.HTML()
        self.value = value

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value
        self.widget.value = '<pre>{}</pre>'.format(value)


class _img():

    def __init__(self, value=None):
        self.widget = widgets.Image(format='png')
        self.value = value

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value
        if value is None:
            return

        data = BytesIO()
        value.savefig(data, format='png', facecolor=self.value.get_facecolor())
        data.seek(0)
        self.widget.value = data.read()


# +
class ScourOptions:
    pass
scour_options = ScourOptions
scour_options.quiet = True
scour_options.strip_ids = True
scour_options.shorten_ids = True
scour_options.enable_viewboxing = True
scour_options.strip_comments = True
scour_options.remove_metadata = True

class _img_svg():
    def __init__(self, value=None):
        self.widget = widgets.HTML()
        self.value = value

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value
        if value is None:
            return
        t0 = time()
        data = BytesIO()
        value.savefig(data, format='svg')
        data.seek(0)
        t1 = time()
        scoured_string = scour.scourString(data.read(), scour_options).encode("UTF-8")
        self.widget.value = scoured_string
        print(t1-t0, time()-t1)
