export interface PositionData {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface MapDrawing {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  type: 'path' | 'circle' | 'marker';
  timestamp: Date;
}

export interface NavigationCommand {
  id: string;
  type: 'direction' | 'danger' | 'drawing' | 'message';
  data: any;
  timestamp: Date;
  from: 'copilot' | 'user';
}

export interface WebRTCConnection {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export interface WebSocketMessage {
  type: 'position' | 'zoom' | 'drawing' | 'direction' | 'danger_zone' | 'connection' | 'guidance_instruction';
  data: any;
  timestamp: Date;
  from: string;
  to: string;
}
