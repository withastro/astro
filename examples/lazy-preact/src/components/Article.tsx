import { h } from 'preact'
import { Suspense, lazy} from 'preact/compat'

const LazyContent = lazy(() => import("./Content"))

// this loader will be renderd on client, 
// between fcp and load of js chunk
const Fallback = () => {
  return (
    <p>
      i'm loader, which nobody should see, 
      but i will be showed on the client
    </p> 
  )
}

const Article = ({id}) => {
  return (
    <div id={id}>
      <h1>HEADER</h1>
      <Suspense fallback={<Fallback/>}>
        <LazyContent>i'm lazy</LazyContent>
      </Suspense>
    </div>
  )
}

export default Article