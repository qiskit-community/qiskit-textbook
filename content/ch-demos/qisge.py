from jupylet.sprite import Sprite as _Sprite
from jupylet.label import Label as _Label
from jupylet.app import App as _App

import numpy as np

from PIL import Image

FPS = 10

_cell = 32
_app = _App(width=28*_cell, height=16*_cell)

_input =  {'key_presses': [], 'clicks': []}
_images = []
_sprites = {}
_texts = {}
_backs = {}
_sounds = []
_channels = {}
_changes = True

@_app.event
def key_event(key, action, modifiers):
    
    global _input
    
    keys = _app.window.keys
    
    button = []
    if key == keys.UP:
        button.append(0)
    if key == keys.DOWN:
        button.append(2)
    if key == keys.LEFT:
        button.append(3)
    if key == keys.RIGHT:
        button.append(1)
    if key == keys.SPACE:
        button.append(4)
    if key == keys.A:
        button.append(5)
    if key == keys.S:
        button.append(6)
    if key == keys.D:
        button.append(7)
    if key == keys.ESCAPE:
        button.append(-1)
    
    if action == keys.ACTION_PRESS:
        for keycode in button:
            if keycode not in _input['key_presses']:
                    _input['key_presses'].append(keycode)  
    if action == keys.ACTION_RELEASE:
        for keycode in button:
            if keycode in _input['key_presses']:
                    _input['key_presses'].remove(keycode)

def update():
    global _sprites, _changes
    if _changes:
        _app.window.clear()   
        for sprite in _sprites.values():
            sprite.draw()
        for back in _backs.values():
            back.draw()
        for text in _texts.values():
            text.draw()
        _changes = False
    return _input


class ImageList(list):
    def __init__(self,filenames):
        super().__init__(filenames)
        global _images
        _images = self.copy()
        
    def __setattr__(self,name,val):
        global _images, _changes
        self.__dict__[name] = val
        _images = self.copy()
        _changes = True
        
    def append(self,filename):
        global _images, _changes
        super().append(filename)
        _images = self.copy()
        _changes = True
        
        
class Sprite():
    
    def __init__(self,image_id,x=0,y=0,z=0,size=1,angle=0,flip_h=0,flip_v=0):
        
        global _sprites
        
        self.sprite_id = len(_sprites)
        _sprites[self.sprite_id] = _Sprite(_images[image_id], width=_cell, height=_cell, anchor_x='left', anchor_y='bottom')
        
        self.image_id = image_id
        self.x = x
        self.y = y
        self.z = z
        self.flip_h = flip_h
        self.flip_v = flip_v
        self.size = size
        self.angle = angle
        
    def __setattr__(self,name,val):
        global _sprites, _changes
        self.__dict__[name] = val
        if name[0]!='_':
            if name=='x':
                _sprites[self.sprite_id].x = val*_cell
            elif name=='y':
                _sprites[self.sprite_id].y = val*_cell
            elif name=='image_id':
                _sprites[self.sprite_id].image = _images[val]
            elif name=='size':
                _sprites[self.sprite_id].width = val*_cell
        _changes = True
        

class Text():
    def __init__(self,text,width,height,x=0,y=0,font_size=0,font=0,angle=0,font_color=(0,0,0),background_color=(255,255,255),border_color=(0,0,0)):

        self.text_id = len(_texts)
        _texts[self.text_id] = _Label('.',anchor_x='left', anchor_y='bottom')
        #_backs[self.text_id] = _Sprite(Image.new('RGB',(1,1),background_color),anchor_x='left', anchor_y='baseline')
        self._background_color = background_color
        
        self.text = text
        self.x = x
        self.y = y
        #self.z = z will be added one day, but not today
        self.font_size = font_size
        self.font = font
        self.width = width
        self.height = height
        self.angle = angle
        self.set_font_color(font_color)
        
    def __setattr__(self,name,val):
        global _texts, _changes
        self.__dict__[name] = val
        if name[0]!='_':
            if name=='x':
                _texts[self.text_id].x = val*_cell
            elif name=='y':
                _texts[self.text_id].y = val*_cell
            if name=='width':
                _texts[self.text_id].width = val*_cell
                self._update_background()
            elif name=='height':
                _texts[self.text_id].height = val*_cell
                self._update_background()
            elif name=='text':
                _texts[self.text_id].text = val
        _changes = True

    def _update_background(self):
        try:
            img = Image.new(
                'RGB',
                (int(self.width*_cell),int(self.height*_cell)),
                self._background_color
            )
            _backs[self.text_id] = _Sprite(
                img,
                x=self.x*_cell, y=self.y*_cell,
                anchor_x='left', anchor_y='baseline')
        except:
            pass
                
    def set_background_color(self,rgb):
        self._background_color = rgb
        self._update_background()
        _changes = True

    def set_font_color(self,rgb):
        _texts[self.text_id].color = rgb
        _changes = True
        
    def set_border_color(self,rgb):
        pass
                
                
# The following features are not yet fully implemented

class SoundList(list):
    def __init__(self,filenames):
        super().__init__(filenames)

class Camera():

    def __init__(self,x=0,y=0,z=0,size=8,angle=0):
        self.x = x
        self.y = y
        self.size = size
        self.angle = angle
        
class Sound():

    def __init__(self,sound_id,playmode=0,volume=1,pitch=1,note=0):
        self.channel_id = len(_channels)

        self.sound_id = sound_id
        self.playmode = playmode
        self.volume = volume
        self.pitch = pitch
        self.note = note