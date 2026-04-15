import * as toast from "@zag-js/toast";

export const useToast = () => {
  const nuxtApp = useNuxtApp();
  const $toast = computed(() => (nuxtApp.$toast as ComputedRef<toast.GroupApi>).value);

  const notify = (
    description: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    $toast.value.create({
      description,
      type
    });
  };

  const save = () => {
    notify(nuxtApp.$i18n.t("notification.save") as string, "success");
  };

  const switchResume = (msg: string) => {
    notify(nuxtApp.$i18n.t("notification.switch", { msg }) as string, "info");
  };

  const deleteResume = (msg: string) => {
    notify(nuxtApp.$i18n.t("notification.delete", { msg }) as string, "error");
  };

  const newResume = () => {
    notify(nuxtApp.$i18n.t("notification.new") as string, "success");
  };

  const duplicate = (msg: string) => {
    notify(
      nuxtApp.$i18n.t("notification.duplicate", {
        old: msg,
        new: msg + " Copy"
      }) as string,
      "success"
    );
  };

  const correct = (msg: true | number) => {
    if (msg === true) {
      notify(nuxtApp.$i18n.t("notification.correct.no") as string, "info");
    } else {
      notify(nuxtApp.$i18n.t("notification.correct.yes", { num: msg }) as string, "success");
    }
  };

  const importResume = (msg: boolean) => {
    if (msg) {
      notify(nuxtApp.$i18n.t("notification.import.yes") as string, "success");
    } else {
      notify(nuxtApp.$i18n.t("notification.import.no") as string, "error");
    }
  };

  return {
    notify,
    save,
    switch: switchResume,
    delete: deleteResume,
    new: newResume,
    duplicate,
    correct,
    import: importResume
  };
};
