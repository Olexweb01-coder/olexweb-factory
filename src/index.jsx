import React from 'react'
import { registerRoot, Composition } from 'remotion'
import { Short } from './Short'
import TL from './timeline.json'
const Root = () => <Composition id="Short" component={Short} durationInFrames={Math.round(TL.duration * TL.fps)} fps={TL.fps} width={1080} height={1920} />
registerRoot(Root)
