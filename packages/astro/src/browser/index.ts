import { execa } from "execa";

/**
 *  Credit: Azhar22 
 *  @see https://github.com/azhar22k/ourl/blob/master/index.js
 */
const commands = ()=>{
	const isGitPod = Boolean(process.env.GITPOD_REPO_ROOT)
	const platform  = (isGitPod) ? 'gitpod' : process.platform

	switch (platform) {
    case 'android':
    case 'linux':
      return ['xdg-open'];
    case 'darwin':
      return ['open'];
    case 'win32':
      return ['cmd', ['/c', 'start']];
	  case 'gitpod':
    		return ['/ide/bin/remote-cli/gitpod-code', ['--openExternal']]
    default:
      throw new Error(`Sorry but it appears that your Platform: "${platform}" isn't supported. \nTo view Astro's Docs visit:\nhttps://docs.astro.build`);
  }
}  


const browser = url => new Promise((res,rej)=>{
	try{
		const [command,args=[]] = commands()
		execa(command,[...args,encodeURI(url)])
		return res()
	}catch(err){
		return rej(err)
	}
})

export default browser

