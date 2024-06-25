window.FieldOptions = {
  data: [
    { name: "All", cname: "Katlar", code: "all" },
    {
      name: "Artificial intelligence",
      cname: "Kat1",
      rel: [
        { name: "BB1"},
        { name: "BB2"},
      ],
      code: "ai",
      children: [
        { name: "BB1", cname: "Bağımsız Bölüm-1", code: "aaai", checked: true},
        { name: "BB2", cname: "Bağımsız Bölüm-2", code: "ijcai", checked: true },
      ],
    },
    {
      name: "Artificial intelligence",
      cname: "Kat2",
      rel: [
        { name: "BB3"},
        { name: "BB4"},
      ],
      code: "ai",
      children: [
        { name: "BB3", cname: "Bağımsız Bölüm-3", code: "aaai", checked: true},
        { name: "BB4", cname: "Bağımsız Bölüm-4", code: "ijcai", checked: true },
      ],
    },
  ],
}
