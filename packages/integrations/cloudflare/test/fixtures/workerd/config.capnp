using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .mainWorker),
    (name = "site-files", disk = ()) #For testing because of relative dirs this must be specified with --directory-path <service-name>=<path>
  ],

  sockets = [
    # Serve HTTP on port 8080.

    ( name = "http",
      address = "*:8080",
      http = (),
      service = "main"
    ),
  ]
);

const mainWorker :Workerd.Worker = (
  modules = [
    (name = "main", esModule = embed "./dist/_worker.js")
  ],
  compatibilityDate = "2023-02-28",
  bindings = [
    (name = "ASSETS", service = "site-files"),
  ]
);
