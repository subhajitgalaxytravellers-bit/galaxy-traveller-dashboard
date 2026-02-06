import ApiPreview from "./ApiPreview";

export default function ModelDetails({ model = null }) {
  return (
    <section className="min-w-0">
      <h2 className="text-lg font-semibold mb-2">Model Details</h2>

      {!model && (
        <div className="rounded-md border p-4 text-sm opacity-80">
          Select a model from the list or create a new one to continue.
        </div>
      )}

      {model && (
        <div className="space-y-3">
          <div className="rounded-md border p-4">
            <div className="text-sm">
              <div>
                <span className="font-medium">Key:</span> {model.key}
              </div>
              <div>
                <span className="font-medium">Name:</span> {model.name}
              </div>
              <div className="mt-2">
                <span className="font-medium">Type:</span>{" "}
                <span className="inline-flex text-xs px-2 py-0.5 rounded-full border">
                  {model.type}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <ApiPreview keyStr={model.key} type={model.type} />
            </div>
          </div>

          <div className="rounded-md border p-4">
            <div className="font-medium mb-2">Fields</div>
            <p className="text-sm opacity-80">
              Field editor will come here next (description, image, relations,
              etc.).
            </p>
            <pre className="text-xs bg-zinc-50 dark:bg-zinc-900 rounded p-2 overflow-auto">
              {JSON.stringify(model.fields ?? [], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
