#!/usr/bin/env python3

from ipywidgets import widgets 
from ipywidgets import Layout, HBox, VBox
from IPython.display import display

class Pixel():
    
    def __init__(self, layout, active=False):
        self.disabled = not active
        self.button = widgets.ToggleButton(description='',button_style='',layout=layout,disabled=self.disabled)
        
    def set_color(self,color):
        if color in ['grey','gray']:
            self.button.button_style = ''
        elif color=='green':
            self.button.button_style = 'success'
        elif color=='blue':
            self.button.button_style = 'info'
        elif color=='orange':
            self.button.button_style = 'warning'
        elif color=='red':
            self.button.button_style = 'danger'
            
    def set_brightness(self,bright):
        if self.disabled:
            self.button.value = not bright
        
    def set_text(self,text):
        self.button.description = text
    
class Screen():
    
    def __init__(self,size,active,L=8):
            
        width = int(size[0]/L)
        wide = str(7*width+24)+'px'
        wider = str(L*width+(L-1)*4)+'px'
        width = str(width)+'px'
        height = str(int(size[1]/L))+'px'
        width = str(int(50*8/L))+'px'

        self._layout = Layout(width=width, height=height)
        self._wide_layout = Layout(width=wide, height=height)
        self._wider_layout = Layout(width=wider, height=height)
    
        self.pixel = {}
        for x in range(L):
            for y in range(L):
                self.pixel[x,y] = Pixel(self._layout,active)
        self.pixel['text'] = Pixel(self._wider_layout)
        

class QiskitGameEngine():
    
    def __init__(self,start,next_frame,L=8,active_screen=False):
        
        
        self.start = start
        self.next_frame = next_frame
        self.L = L
        self.active_screen = active_screen
        self.pressed_pixels = []
        
        self.screen = Screen((400,400),active_screen,L=L)
        layout = self.screen._layout

        controller = {}
        controller['blank'] = widgets.ToggleButton(description='',button_style='',layout=layout)
        controller['up'] = widgets.ToggleButton(description='▲',button_style='',layout=layout)
        controller['down'] = widgets.ToggleButton(description='▼',button_style='',layout=layout)
        controller['left'] = widgets.ToggleButton(description='◀︎',button_style='',layout=layout)
        controller['right'] = widgets.ToggleButton(description='►',button_style='',layout=layout)
        controller['A'] = widgets.ToggleButton(description='A',button_style='',layout=layout)
        controller['B'] = widgets.ToggleButton(description='B',button_style='',layout=layout)
        controller['X'] = widgets.ToggleButton(description='X',button_style='',layout=layout)
        controller['Y'] = widgets.ToggleButton(description='Y',button_style='',layout=layout)
        controller['next'] = widgets.ToggleButton(description='Next',button_style='',layout=self.screen._wide_layout)

        [b,u,d,l,r,A,B,X,Y,c] = [controller['blank'],
                             controller['up'],
                             controller['down'],
                             controller['left'],
                             controller['right'],
                             controller['A'],
                             controller['B'],
                             controller['X'],
                             controller['Y'],
                             controller['next']]

        interface = []
        interface.append( widgets.HBox([self.screen.pixel[x,0].button for x in range(L)]+[b,u,b,b,b,X,b]) )
        interface.append( widgets.HBox([self.screen.pixel[x,1].button for x in range(L)]+[l,b,r,b,Y,b,A]) )
        interface.append( widgets.HBox([self.screen.pixel[x,2].button for x in range(L)]+[b,d,b,b,b,B,b]) )
        interface.append( widgets.HBox([self.screen.pixel[x,3].button for x in range(L)]+[c]) )
        for y in range(4,L):
            interface.append( widgets.HBox([self.screen.pixel[x,y].button for x in range(L)]) )
        interface.append( self.screen.pixel['text'].button )
            
        self.controller = controller
            
        # run user-supplied setup function
        start(self)
            
        display(widgets.VBox(interface))
        
        b.observe(self.given_blank)
        
        for button in self.controller:
            if button!='blank':
                self.controller[button].observe(self.given_button)
                
        if active_screen:
            for pixel in self.screen.pixel.values():
                pixel.button.observe(self.given_screen)
        
        
    def given_blank(self,obs_b):
        if self.controller['blank'].value:
            self.controller['blank'].value = False
    
    
    def given_button(self,obs_n):

        for button in self.controller.values():
            if button.value:
                self.next_frame(self)
            button.value = False
            
    def given_screen(self,obs_s):
            
        if self.active_screen:
            for pos, pixel in self.screen.pixel.items():
                if pixel.button.value:
                    self.pressed_pixels.append(pos)
                    self.next_frame(self)
                pixel.button.value = False              