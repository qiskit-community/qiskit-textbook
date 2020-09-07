#!/usr/bin/env python3
from io import BytesIO

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
