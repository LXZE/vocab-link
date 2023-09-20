
export const generateUID = () => crypto.randomUUID().slice(0, 8);

export function getAgentSystem(){
  if(!('navigator' in window)){
    return 'unknown';
  }
  const platform = navigator.userAgent.toLowerCase();
  if(platform.includes('mac')) return 'macos';
  if(platform.includes('win')) return 'windows';
  if(platform.includes('linux')) return 'linux';
  return 'unknown';
}

export const getModifierKey = () => {
  if (getAgentSystem() == 'macos')
    return '⌘';
  return '^';
};
