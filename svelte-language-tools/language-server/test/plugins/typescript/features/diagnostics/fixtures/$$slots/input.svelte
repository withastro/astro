<script lang="ts">
    interface $$Slots {
        default: {
            valid1: boolean;
            validPropWrongType1: string;
        },
        foo: {
            valid2: boolean;
            validPropWrongType2: string;
        }
    }
</script>

<slot valid1={true} validPropWrongType1={true} />
<slot valid1={true} invalidProp1={true} />
<slot name="foo" valid2={true} validPropWrongType2={true} />
<slot name="foo" valid2={true} invalidProp2={true} />
<slot name="invalid" prop={true} />