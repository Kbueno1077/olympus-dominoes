import { useCallback } from "react";
import { useSnackbar } from "notistack";

export default function useToast() {
  const { enqueueSnackbar } = useSnackbar();

  return useCallback((message, type) => {
    enqueueSnackbar(message, { variant: type });
  }, [enqueueSnackbar]);
}
