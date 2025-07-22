export const Draw = {
  Polygon: jest.fn(),
  Rectangle: jest.fn(),
  Circle: jest.fn(),
  Marker: jest.fn(),
  CircleMarker: jest.fn(),
  Polyline: jest.fn()
};

export const EditToolbar = {
  Edit: jest.fn(),
  Delete: jest.fn()
};

export const DrawEvents = {
  CREATED: 'draw:created',
  EDITED: 'draw:edited',
  DELETED: 'draw:deleted',
  DRAWSTART: 'draw:drawstart',
  DRAWSTOP: 'draw:drawstop',
  DRAWVERTEX: 'draw:drawvertex',
  EDITSTART: 'draw:editstart',
  EDITMOVE: 'draw:editmove',
  EDITRESIZE: 'draw:editresize',
  EDITVERTEX: 'draw:editvertex',
  EDITSTOP: 'draw:editstop',
  DELETESTART: 'draw:deletestart',
  DELETESTOP: 'draw:deletestop'
};