import assert from "node:assert";
import { before, describe, it } from "node:test";
import { validateEnvVariable } from "../src/env/validators.js"

/**
 * @typedef {Parameters<typeof validateEnvVariable>} Params
 */

const createFixture = () => {
    /**
     * @type {{ value: Params[1]; options: Params[2] }} input 
     */
    let input;
    /**
     * @type {ReturnType<typeof validateEnvVariable>}
     */
    let result;

    return {
        /**
         * @param {Params[1]} value 
         * @param {Params[2]} options 
         */
        createInput(value, options) {
            return {
                value,
                options
            }
        },
        /**
         * @param {typeof input} _input 
         */
        givenInput(_input) {
            input = _input
        },
        whenValidating() {
            result = validateEnvVariable("TEST", ...input)
        },
        /**
         * @param {import("../src/env/validators.js").ValidationResultValue} value 
         */
        thenResultShouldBeValid(value) {
            assert.equal(result.ok, true)
            assert.equal(result.value, value)
        },
        thenResultShouldBeInvalid() {
            assert.equal(result.ok, false)
        },
    }
}

describe("astro:env validators", () => {
    /** @type {ReturnType<typeof createFixture>} */
    let fixture;

    before(() => {
        fixture = createFixture()
    })

    it("xxx", () => {
        const input = fixture.createInput(undefined, {
            type: "string",
        })
        fixture.givenInput(input)

        fixture.whenValidating()
        
        fixture.thenResultShouldBeInvalid()
    })
})