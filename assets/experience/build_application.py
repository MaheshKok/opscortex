import bpy, math, json, os
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
scene=bpy.data.scenes.new('Application Journey')
bpy.context.window.scene=scene
def mat(name,color,metal=0,rough=.4,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit: p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emit
 return m
graphite=mat('Journey graphite',(.045,.055,.07),.75,.27)
edge=mat('Journey aluminium',(.27,.31,.36),.85,.3)
paper=mat('Journey ticket',(.86,.84,.79),0,.6)
ink=mat('Journey ink',(.018,.022,.03),0,.65)
red=mat('Journey signal',(.94,.035,.03),.1,.3,1)
muted=mat('Journey metadata',(.2,.23,.27),0,.6)
def box(name,loc,dim,material,bevel=.03):
 x,y,z=[v/2 for v in dim]
 mesh=bpy.data.meshes.new(name)
 mesh.from_pydata([(-x,-y,-z),(-x,-y,z),(-x,y,-z),(-x,y,z),(x,-y,-z),(x,-y,z),(x,y,-z),(x,y,z)],[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)])
 mesh.materials.append(material)
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.location=loc
 if bevel: mod=o.modifiers.new('Machined edges','BEVEL');mod.width=bevel;mod.segments=3
 return o
def label(name,text,x,z,size,material,y=-.18):
 curve=bpy.data.curves.new(name,'FONT');curve.body=text;curve.size=size;curve.extrude=.0005
 o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);o.location=(x,y,z);o.rotation_euler=(math.pi/2,0,0)
 curve.materials.append(material)
 return o
app=[]
app.append(box('app_chassis',(0,0,0),(3.2,.2,2.2),graphite,.07))
app.append(box('app_ticket',(0,-.115,0),(2.94,.035,1.94),paper,.04))
app.append(box('app_signal',(-1.28,-.15,.72),(.06,.02,.06),red,.015))
app += [label('app_name','tickets-api',-1.14,.66,.16,ink),
label('app_title','Front row reserved',-1.29,.1,.22,ink),
label('app_booking','ON-2047   /   OPENING NIGHT',-1.28,-.22,.09,muted),
label('app_seats','2 seats',-1.28,-.65,.11,ink),
label('app_confirmed','CONFIRMED',.57,-.65,.085,muted)]
app.append(box('app_rule',(0,-.151,-.39),(2.56,.01,.008),muted,0))
shell=[
 box('shell_left',(-1.78,.28,0),(.14,1.12,2.62),edge),
 box('shell_right',(1.78,.28,0),(.14,1.12,2.62),edge),
 box('shell_top',(0,.28,1.31),(3.7,1.12,.14),graphite),
 box('shell_bottom',(0,.28,-1.31),(3.7,1.12,.14),graphite),
 box('shell_back',(0,.83,0),(3.7,.12,2.76),graphite)]
for x in [-1.68,1.68]:
 app.append(box('app_corner', (x,-.3,0),(.026,.025,2.5),red,.005))
# Keep all exported pieces as separately named nodes. Apply bevels to the web model.
for o in list(scene.objects):
 if o.type=='FONT':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
web=ROOT/'public/models/experience/application-module.glb';web.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(web),export_format='GLB',use_active_scene=True,export_apply=True,export_cameras=False,export_lights=False)
source=ROOT/'assets/experience/application-journey.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(source))
print(json.dumps({'scene':scene.name,'objects':len(scene.objects),'web_bytes':web.stat().st_size,'shell_nodes':[o.name for o in shell]}),flush=True)
if os.getenv('JOURNEY_RENDER')=='1':
 originals=list(scene.objects)
 ground=box('Render floor',(0,0,-1.58),(200,200,.15),mat('Render ground',(.02,.025,.035),.2,.35),0)
 world=bpy.data.worlds.new('Journey world');scene.world=world;world.use_nodes=True
 world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.13,.18,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35
 def light(name,loc,power,size,color):
  d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
  o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
 light('Key',(2,-5,7),1300,5,(.88,.93,1));light('Rim',(-5,2,4),1700,4,(.45,.58,1));light('Warm',(5,3,2),1300,3,(1,.3,.15))
 d=bpy.data.cameras.new('Journey camera');cam=bpy.data.objects.new('Journey camera',d);scene.collection.objects.link(cam);scene.camera=cam
 cam.location=(5,-10,4.5);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=7
 scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
 scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=92;scene.view_settings.view_transform='AgX'
 def render(name):
  scene.render.filepath=str(ROOT/f'public/images/experience/journey-{name}.jpg');bpy.ops.render.render(write_still=True)
 for o in shell:o.hide_render=True
 render('application')
 for o in shell:o.hide_render=False
 render('docker')
 # Spread three identical images; original remains middle, copies get matching scale and orientation.
 for idx,loc in enumerate([(-4.4,.5,0),(4.4,.5,0)]):
  for o in originals:
   n=o.copy();n.data=o.data;scene.collection.objects.link(n);n.location=o.location+Vector(loc);n.hide_render=False
 d.ortho_scale=15.2;cam.location=(5,-14,7);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
 render('kubernetes')
 print('JOURNEY_RENDERS_READY',flush=True)
