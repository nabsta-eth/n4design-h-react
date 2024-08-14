function useHookErrorWrapper<T>(hook: () => T) {
  try {
    return hook();
  } catch (e) {
    console.error(e);
    return;
  }
}

export default useHookErrorWrapper;
