import { describe, expect, it } from "vitest";
import {
  adminMemberSchema,
  memberSchema,
  memberToAdminFormValues,
  memberToFormValues,
} from "@/lib/member-schema";
import { makeFormValues, makeMember } from "@/lib/test-fixtures";

describe("memberSchema", () => {
  it("accepts a valid member profile", () => {
    const result = memberSchema.safeParse(makeFormValues());
    expect(result.success).toBe(true);
  });

  it("requires core directory fields", () => {
    const result = memberSchema.safeParse(
      makeFormValues({
        name: "",
        company: "",
        title: "",
        function: "",
        diseaseAreas: "",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toEqual(
        expect.arrayContaining([
          "name",
          "company",
          "title",
          "function",
          "diseaseAreas",
        ]),
      );
    }
  });

  it("allows empty optional personal email", () => {
    const result = memberSchema.safeParse(
      makeFormValues({ emailPersonal: "" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects invalid personal email", () => {
    const result = memberSchema.safeParse(
      makeFormValues({ emailPersonal: "not-an-email" }),
    );
    expect(result.success).toBe(false);
  });
});

describe("adminMemberSchema", () => {
  it("requires a valid work email", () => {
    const invalid = adminMemberSchema.safeParse({
      ...makeFormValues(),
      emailWork: "bad",
    });
    expect(invalid.success).toBe(false);

    const valid = adminMemberSchema.safeParse({
      ...makeFormValues(),
      emailWork: "aisha@acme.com",
    });
    expect(valid.success).toBe(true);
  });
});

describe("form value helpers", () => {
  it("maps a member to form values", () => {
    expect(memberToFormValues(makeMember())).toEqual({
      name: "Aisha Khan",
      company: "Acme Bio",
      title: "Scientist",
      function: "R&D",
      diseaseAreas: "Oncology",
      emailPersonal: undefined,
      phone: undefined,
    });
  });

  it("maps a member to admin form values including work email", () => {
    expect(memberToAdminFormValues(makeMember())).toMatchObject({
      emailWork: "aisha@acme.com",
      name: "Aisha Khan",
    });
  });
});
