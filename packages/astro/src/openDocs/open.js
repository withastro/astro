import { execa } from "execa";

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
      throw new Error(`Sorry but it appears that your Platform: "${platform}" isn't supported.`);
  }
}  


const launch = url => new Promise((res,rej)=>{
	try{
		const [command,args=[]] = commands()
		execa(command,[...args,encodeURI(url)])
		return res()
	}catch(err){
		return rej(err)
	}
})

launch('https://docs.astro.build/')
launch('https://rainsberger.ca')
launch('https://www.google.com')
