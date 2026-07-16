import { describe, expect, it } from "vitest";
import {
  filterAndSortMembers,
  memberMatchesSearch,
  toggleColumnSort,
  type AdminDirectoryQueryable,
} from "@/lib/admin-directory-query";

function member(
  overrides: Partial<AdminDirectoryQueryable> & { name: string },
): AdminDirectoryQueryable {
  return {
    company: "Acme",
    title: "Scientist",
    function: "R&D",
    emailWork: `${overrides.name.toLowerCase().replace(/\s+/g, ".")}@acme.com`,
    registeredAt: "2024-01-01T00:00:00.000Z",
    isAdmin: false,
    ...overrides,
  };
}

describe("memberMatchesSearch", () => {
  it("matches name, company, title, function, and email", () => {
    const row = member({
      name: "Aisha Khan",
      company: "BioLabs",
      title: "Director",
      function: "Clinical",
      emailWork: "aisha@biolabs.com",
    });

    expect(memberMatchesSearch(row, "aisha")).toBe(true);
    expect(memberMatchesSearch(row, "biolabs")).toBe(true);
    expect(memberMatchesSearch(row, "director")).toBe(true);
    expect(memberMatchesSearch(row, "clinical")).toBe(true);
    expect(memberMatchesSearch(row, "aisha@biolabs")).toBe(true);
    expect(memberMatchesSearch(row, "missing")).toBe(false);
  });

  it("requires every search token to match some field", () => {
    const row = member({
      name: "Adam Lee",
      company: "Acme",
    });

    expect(memberMatchesSearch(row, "adam acme")).toBe(true);
    expect(memberMatchesSearch(row, "adam zenith")).toBe(false);
  });

  it("treats blank query as a match", () => {
    expect(memberMatchesSearch(member({ name: "Sam" }), "  ")).toBe(true);
  });
});

describe("filterAndSortMembers", () => {
  const members = [
    member({
      name: "Zara Ahmed",
      company: "Zenith",
      registeredAt: "2024-03-01T00:00:00.000Z",
      isAdmin: true,
    }),
    member({
      name: "Adam Lee",
      company: "Acme",
      registeredAt: "2024-01-01T00:00:00.000Z",
      isAdmin: false,
    }),
    member({
      name: "Mona Said",
      company: "BioLabs",
      registeredAt: "2024-02-01T00:00:00.000Z",
      isAdmin: false,
    }),
  ];

  it("filters by role and query together", () => {
    const result = filterAndSortMembers(members, {
      query: "a",
      role: "admin",
      sort: "name-asc",
    });

    expect(result.map((m) => m.name)).toEqual(["Zara Ahmed"]);
  });

  it("sorts by name ascending by default", () => {
    expect(filterAndSortMembers(members).map((m) => m.name)).toEqual([
      "Adam Lee",
      "Mona Said",
      "Zara Ahmed",
    ]);
  });

  it("sorts by newest registration", () => {
    expect(
      filterAndSortMembers(members, { sort: "registered-desc" }).map(
        (m) => m.name,
      ),
    ).toEqual(["Zara Ahmed", "Mona Said", "Adam Lee"]);
  });

  it("sorts by company", () => {
    expect(
      filterAndSortMembers(members, { sort: "company-asc" }).map(
        (m) => m.company,
      ),
    ).toEqual(["Acme", "BioLabs", "Zenith"]);
  });

  it("sorts admins first for role-desc", () => {
    expect(
      filterAndSortMembers(members, { sort: "role-desc" }).map((m) => m.name),
    ).toEqual(["Zara Ahmed", "Adam Lee", "Mona Said"]);
  });

  it("sorts by email", () => {
    expect(
      filterAndSortMembers(members, { sort: "email-asc" }).map(
        (m) => m.emailWork,
      ),
    ).toEqual([
      "adam.lee@acme.com",
      "mona.said@acme.com",
      "zara.ahmed@acme.com",
    ]);
  });
});

describe("toggleColumnSort", () => {
  it("applies a column default when switching columns", () => {
    expect(toggleColumnSort("name-asc", "registered")).toBe("registered-desc");
    expect(toggleColumnSort("registered-desc", "company")).toBe("company-asc");
  });

  it("flips direction when clicking the active column", () => {
    expect(toggleColumnSort("name-asc", "name")).toBe("name-desc");
    expect(toggleColumnSort("name-desc", "name")).toBe("name-asc");
  });
});
