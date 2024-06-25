window.FieldPicker = function (container, options) {
  var Picker = {
    // expose states
    ComponentId: "",
    Options: {},
    Selected: [], // user selected data
    Fields: {
      RootField: {},
      MainField: [],
    }, // original data
    Skips: [], // skip data list
    Visiable: false,
    // expose functions
    GetSelected: GetSelected,
    Show: ShowPicker,
    Hide: HidePicker,
  };

  function GetSelected() {
    return this.Selected;
  }

  function Feedback(event) {
    if (Picker.Options && Picker.Options.updater && typeof Picker.Options.updater === "function") {
      Picker.Options.updater(Picker.Selected, event, Picker);
    }
  }

  function getRootField(datasets) {
    const [rootInfo] = datasets;
    const { cname, code } = rootInfo;
    const allChildrenChecked = datasets.every((dataset) => dataset.checked);
    const state = allChildrenChecked ? "checked" : "";

    return `
      <div class="field-picker-row-container">
        <div class="field-picker-title clickable">${cname}</div>
        <div class="field-picker-checkbox-container">
          <label for="field-${code}" class="field-picker-checkbox-label field-picker-checkbox-group">
            <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
            <span class="field-checkbox-item clickable"></span>
          </label>
        </div>
      </div>
    `;
  }

  function getSingleField(dataset) {
    const { name, cname, code, checked, link, children } = dataset;
    const state = checked ? "checked" : "";
    let content = `
      <div class="field-picker-row-container">
        <div class="field-picker-title">${cname}</div>
        <div class="field-picker-checkbox-container">
          <label for="field-${code}" class="field-picker-checkbox-label field-picker-checkbox-group">
            <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
            <span class="field-checkbox-item clickable"></span>
          </label>
        </div>
      </div>
    `;

    if (children && children.length) {
      const allChildrenChecked = children.every((child) => child.checked);
      const indeterminateState = !allChildrenChecked && children.some((child) => child.checked);

      content = `
        <div class="field-picker-row-container">
          <div class="field-picker-menu-group">
            <div class="field-picker-sign clickable">+</div>
            <div class="field-picker-title clickable">${cname}</div>
          </div>
          <div class="field-picker-checkbox-container">
            <label for="field-${code}" class="field-picker-checkbox-label field-picker-checkbox-group">
              <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
              <span class="field-checkbox-item clickable ${indeterminateState ? "is-indeterminate" : ""}"></span>
            </label>
          </div>
        </div>
        ${getSingleFieldChildren(children)}
      `;
    }

    return `
      <div class="field-picker-item-group">
        ${content}
      </div>
    `;
  }

  function getSingleFieldChildren(dataset) {
    if (!dataset || !dataset.length) {
      return "";
    }

    return `
      <div class="field-picker-children-group field-picker-groups hide">
        ${dataset.map((item) => getSingleField(item)).join("")}
      </div>
    `;
  }

  function InitBaseContainer(container, componentId) {
    const visiableClass = Picker.Visiable ? "" : "hide";
    const template = `
      <div id="${componentId}" class="field-picker-container no-select ${visiableClass}">
        <div class="field-picker-item-group">
          ${getRootField(Picker.Fields.RootField)}
          <div class="field-picker-children-group field-picker-top-groups">
            ${Picker.Fields.MainField.map((dataset) => getSingleField(dataset)).join("")}
          </div>
        </div>
      </div>
    `;

    const containerElement = document.querySelector(container);
    containerElement.innerHTML = template;
  }

  /**
   * Update the select data of the field picker based on the expanded content
   */
  function updateSelectData() {
    const container = document.getElementById(Picker.ComponentId);
    const checkboxes = Array.from(container.querySelectorAll(".field-picker-checkbox-label input[type=checkbox]"));
    checkboxes.forEach((checkbox) => {
      updateParentCheckboxState(checkbox);
    });

    Picker.Selected = checkboxes
      .map((checkbox) => {
        return checkbox.checked ? checkbox.value : null;
      })
      .filter((value) => value);

    Feedback("change");
  }

  /**
   * checkbox bind event
   */
  function handleCheckboxClick() {
    const container = document.getElementById(Picker.ComponentId);
    container.addEventListener(
      "click",
      function (event) {
        const checkbox = event.target.closest(".field-picker-checkbox-label input[type=checkbox]");
        if (!checkbox) return;
        if (checkbox.value == "field-all") {
          updateCheckboxState(checkbox, true);
        } else {
          updateCheckboxState(checkbox);
        }
        updateSelectData();
      },
      false
    );
  }

  /**
   * Update the parent checkboxes based on the initial selection of children
   * @param {*} checkbox
   */
  function updateParentCheckboxState(checkbox) {
    const container = document.getElementById(Picker.ComponentId);
    const groups = container.querySelectorAll(".field-picker-top-groups > .field-picker-item-group");
    const parentItem = checkbox.closest(".field-picker-item-group");

    // todo reduce
    Array.from(groups).forEach((group) => {
      if (group == parentItem) {
        const checkboxStateKeeper = group.querySelector(".field-checkbox-item");
        const groupCheckboxes = Array.from(group.querySelectorAll(".field-picker-groups input[type=checkbox]"));
        const checkedSiblings = Array.from(group.querySelectorAll(".field-picker-groups input[type=checkbox]:checked"));
        const skipItems = groupCheckboxes.filter((item) => {
          return Picker.Skips.includes(item.value);
        }).length;

        if (checkedSiblings.length) {
          const parentContainer = checkboxStateKeeper.closest(".field-picker-checkbox-group");
          const parentCheckbox = parentContainer.querySelector("input[type=checkbox]");
          parentCheckbox.checked = false;

          // allow skip elements
          if (groupCheckboxes.length <= checkedSiblings.length + skipItems) {
            checkboxStateKeeper.classList.remove("is-indeterminate");
            checkboxStateKeeper.classList.add("checked");
            parentCheckbox.checked = true;
          } else if (checkedSiblings.length > 0) {
            checkboxStateKeeper.classList.add("is-indeterminate");
            checkboxStateKeeper.classList.remove("checked");
          } else {
            checkboxStateKeeper.classList.remove("is-indeterminate");
            checkboxStateKeeper.classList.remove("checked");
          }
        }
      }
    });

    const mainFieldsChecked = container.querySelectorAll(".field-picker-top-groups > .field-picker-item-group > .field-picker-row-container input[type=checkbox]:checked");
    let all = document.querySelector(".field-picker-item-group #field-all");
    let allCheckboxStateKeeper = all.closest(".field-picker-checkbox-group").querySelector(".field-checkbox-item");
    all.checked = false;

    if (mainFieldsChecked.length == groups.length) {
      allCheckboxStateKeeper.classList.remove("is-indeterminate");
      allCheckboxStateKeeper.classList.add("checked");
      all.checked = true;
    } else if (mainFieldsChecked.length > 1) {
      allCheckboxStateKeeper.classList.remove("checked");
      allCheckboxStateKeeper.classList.add("is-indeterminate");
    } else {
      allCheckboxStateKeeper.classList.remove("checked");
      allCheckboxStateKeeper.classList.remove("is-indeterminate");
    }
  }

  /**
   * Function to handle checkbox events
   * @param {*} checkbox
   */
  function updateCheckboxState(checkbox, isRoot) {
    const isChecked = checkbox.checked;
    const currentPicker = checkbox.closest(".field-picker-item-group");
    const childrenPicker = currentPicker.querySelector(".field-picker-children-group");

    toggleChildrenCheckboxes(childrenPicker, isChecked);

    updateParentCheckboxState(checkbox);
  }

  /**
   * Function to toggle the state of children checkboxes
   * @param {*} childrenPicker
   * @param {*} isChecked
   */
  function toggleChildrenCheckboxes(childrenPicker, isChecked) {
    if (childrenPicker) {
      const childCheckboxes = childrenPicker.querySelectorAll("input[type=checkbox]");
      childCheckboxes.forEach((childCheckbox) => {
        if (Picker.Skips.includes(childCheckbox.value)) return;
        childCheckbox.checked = isChecked;
      });
    }
  }

  function triggerExpend(btnExpend, forceState) {
    if (!btnExpend) return;
    const children = btnExpend.closest(".field-picker-item-group").querySelector(".field-picker-children-group");
    if (typeof forceState === "string") {
      if (forceState === "expand") {
        children.classList.remove("hide");
        btnExpend.textContent = "-";
      } else if (forceState === "collapse") {
        children.classList.add("hide");
        btnExpend.textContent = "+";
      }
    } else {
      const isHidden = children.classList.contains("hide");
      if (isHidden) {
        children.classList.remove("hide");
        btnExpend.textContent = "-";
      } else {
        children.classList.add("hide");
        btnExpend.textContent = "+";
      }
    }
  }

  function handleExpendClick() {
    const container = document.getElementById(Picker.ComponentId);
    container.addEventListener("click", function (event) {
      const btnExpend = event.target.closest(".field-picker-sign");
      triggerExpend(btnExpend);
    });
  }

  function handleTitleClick() {
    const container = document.getElementById(Picker.ComponentId);
    container.addEventListener("click", function (event) {
      if (!event.target.closest(".field-picker-title")) return;
      const rowContainer = event.target.closest(".field-picker-menu-group");
      if (rowContainer) {
        const btnExpend = rowContainer.querySelector(".field-picker-sign");
        if (btnExpend) {
          triggerExpend(btnExpend);
        }
      } else {
        const container = event.target.closest(".field-picker-item-group").querySelector(".field-picker-children-group");
        if (!container) return;
        const btnExpends = container.querySelectorAll(".field-picker-sign");
        if (!btnExpends) return;

        const allExpendStates = Array.from(btnExpends)
          .map((btnExpend) => btnExpend.innerHTML.trim() == "-")
          .filter((n) => n);

        if (allExpendStates.length !== btnExpends.length) {
          btnExpends.forEach((btnExpend) => {
            triggerExpend(btnExpend, "expand");
          });
        } else {
          btnExpends.forEach((btnExpend) => {
            triggerExpend(btnExpend);
          });
        }
      }
    });
  }

  /**
   * Show the region picker
   */
  function ShowPicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className.replace(/\s?hide/g, "");
    Picker.Visiable = true;
  }

  /**
   * Hide the region picker
   */
  function HidePicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className + " hide";
    Picker.Visiable = false;
    Feedback("submit");
  }

  function Bootstrap(container, options) {
    const componentId = "field-picker-" + Math.random().toString(36).slice(-6);
    Picker.ComponentId = componentId;

    Picker.Options = options;
    const { data, preselected, skips, visiable } = options;

    Picker.Visiable = !!visiable;
    Picker.Fields.RootField = [data[0]];
    Picker.Fields.MainField = data.slice(1);

    const checkboxCheckedbyRemoteAPI = data
      .map((field) => {
        if (field.children && field.children.length) {
          return field.children.filter((item) => item.checked);
        }
        return false;
      })
      .filter((n) => n)
      .reduce((a, b) => a.concat(b), [])
      .map((item) => item.code);

    Picker.Selected = checkboxCheckedbyRemoteAPI;
    if (preselected) {
      if (typeof preselected === "string") {
        // use all fields
        if (preselected === "all") {
          Picker.Selected = Picker.Fields.MainField.map((field) => field.code).concat(Picker.Fields.RootField.map((field) => field.code));
        } else {
          if (!Picker.Selected.includes(preselected)) {
            Picker.Selected = Picker.Selected.concat(preselected);
          }
        }
      } else if (preselected && preselected.length) {
        preselected.forEach((selected) => {
          if (!Picker.Selected.includes(selected)) {
            Picker.Selected = Picker.Selected.concat(selected);
          }
        });
      }
    }

    if (skips) {
      if (typeof skips === "string") {
        Picker.Skips = [skips];
      } else if (skips.length) {
        Picker.Skips = skips;
      }
    }

    InitBaseContainer(container, componentId);

    handleExpendClick();
    handleTitleClick();
    handleCheckboxClick();

    updateSelectData();

    Feedback("init");

    return Picker;
  }

  return Bootstrap(container, options);
};
