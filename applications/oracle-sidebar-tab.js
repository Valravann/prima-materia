const { HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;

function pm() {
  return game.modules.get("prima-materia")?.api;
}

export class PrimaMateriaOracleSidebarTab extends HandlebarsApplicationMixin(
  AbstractSidebarTab,
) {
  static tabName = "primaMateria";

  static DEFAULT_OPTIONS = {
    id: "prima-materia-sidebar-launcher",
    tag: "section",
    classes: ["prima-materia", "prima-materia-sidebar-launcher-app"],
    window: {
      title: "Prima Materia",
      icon: "fa-solid fa-sparkles",
    },
  };

  static PARTS = {
    main: {
      template: "modules/prima-materia/templates/oracle-sidebar.hbs",
    },
  };

  async _prepareContext() {
    const api = pm();
    const currentFrame = api?.getFrame?.() ?? "literal";
    const currentTint = api?.getTint?.() ?? "neutral";

    return {
      currentFrameLabel: api?.labelForFrame?.(currentFrame) ?? "Literal",
      currentFrameDescription: api?.describeFrame?.(currentFrame) ?? "",
      currentTintLabel: api?.labelForTint?.(currentTint) ?? "Neutral",
      currentTintDescription: api?.describeTint?.(currentTint) ?? "",
      showTintWidget: game.settings.get("prima-materia", "showTintWidget"),
      showFrameSelector: game.settings.get(
        "prima-materia",
        "showFrameSelector",
      ),
    };
  }

  async _onClickAction(event, target) {
    event.preventDefault();

    const api = pm();
    const action = target.dataset.action;

    switch (action) {
      case "open-oracle":
        return api?.openOracle?.();
      case "open-portent":
        return api?.openPortent?.();
      case "open-frame-widget":
        return api?.openFrameWidget?.();
      case "open-tint-widget":
        return api?.openTintWidget?.();
      default:
        return undefined;
    }
  }
}
