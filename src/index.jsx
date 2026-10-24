import React from 'react'
import { registerRoot, Composition } from 'remotion'
import { Short } from './Short'
import { Long } from './Long'
import TL from './timeline.json'
const Root = () => (<>
  <Composition id="Short" component={Short} durationInFrames={Math.round(TL.duration * TL.fps)} fps={TL.fps} width={1080} height={1920} />
  <Composition id="Long" component={Long} durationInFrames={Math.round(TL.duration * TL.fps)} fps={TL.fps} width={1920} height={1080} />
</>)
registerRoot(Root)
