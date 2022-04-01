import { execa } from "execa";

/**
 *  Credit: Azhar22 
 *  @see https://github.com/azhar22k/ourl/blob/master/index.js
 */
const commands =():any=>{
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

//@ts-ignore
const browser = async(url:any):any=>{
	try{
		const [command,args=[]] = commands()
		return execa(command,[...args,encodeURI(url)])
	}catch(err){
		throw Error(`${err}`)
	}
} 

export default browser

