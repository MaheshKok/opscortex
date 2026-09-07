import bpy, math, random, json
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
random.seed(12)
scene=bpy.data.scenes.new('Behind the Click')
bpy.context.window.scene=scene
def material(name,color,metal=0,rough=.4,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Metallic'].default_value=metal
 p.inputs['Roughness'].default_value=rough
 if emission:
  p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
graphite=material('Graphite anodised steel',(.055,.065,.076),.8,.28)
edge=material('Brushed aluminium edges',(.22,.25,.29),.85,.32)
black=material('Vent darkness',(.009,.014,.02),.35,.5)
panel=material('Server titanium',(.12,.14,.16),.72,.38)
floor=material('Raised graphite floor',(.13,.15,.17),.55,.29)
white=material('Warm white luminaire',(.82,.88,1),0,.25,5)
led=material('Ready LEDs',(.18,.7,.5),0,.25,3)
red=material('OpsCortex signal',(.93,.045,.035),0,.25,2)
def box(name,loc,dim,mat,bevel=0):
 # Direct mesh creation avoids dependency-graph updates for every primitive.
 x,y,z=(v/2 for v in dim)
 verts=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
 faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.materials.append(mat)
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.location=loc
 if bevel:
  mod=o.modifiers.new('Manufactured edges','BEVEL');mod.width=bevel;mod.segments=2
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
# Floor tile joints remain visible under shallow reflections.
for x in range(-4,5):
 for y in range(-9,18):
  box('Raised floor panel',(x*.8,y*.8,-.06),(.794,.794,.12),floor,.009)
box('Ceiling',(0,4.3,3.55),(8,23,.18),black,.01)
box('Rear wall',(0,14.3,1.8),(8,.15,3.6),graphite,.01)
# Architectural vertical rhythm, modeled equipment, rails and ventilation.
for side in [-1,1]:
 x=side*2.18;face=x-side*.55
 for bay in range(9):
  y=-2.4+bay*1.5
  box('Rack chassis',(x,y,1.46),(1.1,1.39,2.8),graphite,.028)
  box('Recessed equipment bay',(face-side*.014,y,1.48),(.025,1.23,2.59),black)
  for yy in [y-.65,y+.65]:
   box('Rack vertical rail',(face-side*.028,yy,1.48),(.06,.048,2.68),edge,.008)
  for zz in [.15,2.82]:
   box('Rack crossmember',(face-side*.025,y,zz),(.07,1.33,.065),edge,.008)
  for unit in range(12):
   z=.29+unit*.197
   box('Server unit',(face-side*.047,y,z),(.062,1.16,.168),panel,.007)
   for yy in [y-.47,y+.47]:
    box('Server pull handle',(face-side*.09,yy,z),(.04,.022,.1),edge,.005)
   for vent in range(10):
    box('Vent perforation',(face-side*.081,y-.36+vent*.072,z),(.003,.046,.103),black,.004)
   box('Unit status',(face-side*.087,y+.41,z+.047),(.009,.014,.014),led)
   box('Unit power',(face-side*.087,y+.41,z-.019),(.009,.023,.027),black,.003)
  box('Rack header plate',(face-side*.086,y,2.66),(.02,.58,.075),black,.004)
 # overhead cable ladder and support struts
 for xx in [side*1.21,side*1.63]:
  box('Cable tray rim',(xx,4.2,3.16),(.04,21,.075),edge,.007)
 for y in range(-6,15):
  box('Cable tray rung',(side*1.42,y,3.16),(.47,.035,.04),edge,.004)
 for c in range(5):
  box('Bundled trunk cable',(side*(1.28+c*.065),4.1,3.23),(.042,21,.036),black,.01)
 for y in [-4,0,4,8,12]:
  box('Ceiling suspension',(side*1.42,y,3.37),(.025,.025,.32),edge,.003)
# Linear ceiling lighting and threshold lighting are restrained.
for y in [-4.4,-.4,3.6,7.6,11.6]:
 box('Ceiling luminaire housing',(0,y,3.42),(.19,2.8,.07),graphite,.01)
 box('Ceiling luminaire',(0,y,3.372),(.105,2.64,.015),white,.008)
for x in [-1.56,1.56]:
 box('Aisle guide',(x,4.2,.008),(.018,19,.006),edge)
# Distant engineering station gives camera a destination.
box('Console plinth',(0,10.45,.48),(.62,.55,.96),graphite,.05)
box('Console worktop',(0,10.4,1.0),(1.35,.78,.08),edge,.025)
box('Display housing',(0,10.59,1.48),(1.02,.09,.63),graphite,.032)
box('Display glass',(0,10.537,1.48),(.94,.012,.55),black,.015)
box('Display signal',(0,10.526,1.66),(.68,.004,.012),red)
# A few horizontal screen traces, abstract and intentionally no baked text.
for i in range(4):
 box('Display trace',(-.13,10.526,1.52-i*.07),(.42-i*.05,.004,.009),edge)
# Light pools instead of a neon corridor.
def area(name,loc,target,power,size,color):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc
 o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
for y in [-5,-1,3,7,11]:
 area('Ceiling soft pool',(0,y,3.29),(0,y,0),270,2.5,(.79,.85,1))
area('Entry softbox',(0,-7,2.9),(0,2,1.3),450,4,(.66,.76,1))
area('Console key',(0,8,2.8),(0,10.5,1.2),180,2,(1,.79,.64))
area('Rear wall wash',(0,13.6,1.7),(0,8,1.7),100,1.2,(.85,.18,.12))
world=bpy.data.worlds.new('Night studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.08,.1,.14,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.15;scene.world=world
camdata=bpy.data.cameras.new('Arrival');cam=bpy.data.objects.new('Arrival',camdata);scene.collection.objects.link(cam)
cam.location=(.12,-7.8,1.65);cam.rotation_euler=(Vector((0,5,1.58))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.lens=25;camdata.sensor_width=36;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=93
scene.render.filepath=str(ROOT/'public/images/experience/arrival.jpg')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/experience/scene-final.blend'))
print(json.dumps({'scene':scene.name,'objects':len(scene.objects),'render':scene.render.filepath}))

# Render and export use the same source scene.
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences
 prefs.compute_device_type='METAL';prefs.get_devices()
 for device in prefs.devices: device.use=True
 scene.cycles.device='GPU'
except Exception: pass
bpy.ops.render.render(write_still=True)
# Web model merges static geometry by material to keep draw calls bounded.
export_scene=bpy.data.scenes.new('Web export')
groups={}
for obj in scene.objects:
 if obj.type!='MESH':continue
 mat=obj.data.materials[0]
 vs,fs=groups.setdefault(mat.name,([],[]))
 offset=len(vs)
 vs.extend([tuple(obj.matrix_world@v.co) for v in obj.data.vertices])
 fs.extend([tuple(offset+i for i in f.vertices) for f in obj.data.polygons])
for name,(vs,fs) in groups.items():
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.materials.append(bpy.data.materials[name])
 ob=bpy.data.objects.new(name,mesh);export_scene.collection.objects.link(ob)
bpy.context.window.scene=export_scene
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/experience/aisle.glb'),export_format='GLB',use_active_scene=True,export_cameras=False,export_lights=False)
print('ARTIFACTS_READY',len(export_scene.objects),flush=True)
