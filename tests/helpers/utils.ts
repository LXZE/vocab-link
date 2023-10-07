export function waitFor(variableCheckFn: () => boolean) {
  return new Promise<void>((resolve) => {
    let interval = setInterval(function() {
      if (variableCheckFn()) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
}
