const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function pm() {
  return game.modules.get("prima-materia")?.api;
}

/**
 * Floating frame selection widget.
 */
export class PrimaMateriaFrameSelector extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  static DEFAULT_OPTIONS = {
    id: "prima-materia-frame-selector",
    tag: "section",
    classes: ["prima-materia-widget-app"],
    position: {
      width: 240,
      height: "auto",
      top: 340,
      left: 24,
    },
    window: {
      title: "Prima Materia Frame",
      icon: "fa-solid fa-layer-group",
      resizable: false,
    },
  };

  constructor(options = {}) {
    const width = 240;
    const left = Math.max(24, window.innerWidth - width - 24);
    options = foundry.utils.mergeObject(
      {
        position: { left },
      },
      options,
      { overwrite: false },
    );

    super(options);
  }

  static PARTS = {
    main: {
      template: "modules/prima-materia/templates/frame-selector.hbs",
    },
  };

  async _prepareContext() {
    const api = pm();
    const frame = api.getFrame();

    return {
      frame,
      frameLabel: api.labelForFrame(frame),
      frameDescription: api.describeFrame(frame),
      literalClass: frame === "literal" ? "active" : "",
      personalClass: frame === "personal" ? "active" : "",
      structuralClass: frame === "structural" ? "active" : "",
      literalDescription: api.describeFrame("literal"),
      personalDescription: api.describeFrame("personal"),
      structuralDescription: api.describeFrame("structural"),
    };
  }

  async _onClickAction(event, target) {
    event.preventDefault();

    if (target.dataset.action !== "set-frame") return;
    await pm().setFrame(target.dataset.frame);
    await this.render({ force: true });
  }
}
