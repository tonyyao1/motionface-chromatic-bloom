import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(17);
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
Config.setChromiumOpenGlRenderer('angle');
// Use installed Chrome on macOS; other systems use Remotion's bundled browser.
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (process.platform === 'darwin' && existsSync(chrome)) Config.setBrowserExecutable(chrome);
