import { useSnackbar, VariantType } from "notistack";

export default function useToast() {
  const { enqueueSnackbar } = useSnackbar();

  const displayToast = (message, type) => {
    enqueueSnackbar(message, { variant: type });
  };

  return displayToast;
}
