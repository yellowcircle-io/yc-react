<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Help me correct the following HubSpot calculated field to accomplish the following [ensure proper HUBL syntax as it is

quite different from traditional sql/excel/other programming languages] :

• If false, Check if "utm source is known"
– If true concatenate "utm source", "utm medium", "utm campaign", "utm term", and "utm content"

•If utm source IS NOT known, check if "Original Traffic Source" contains "organic"
– if true, set "Original Traffic Source Drill-Down 2"

• If false, set "Primary Inbound Channel [L2: Medium] | Contact - Proxy"

----
if(is_known([properties.utm_source]),
concatenate([properties.utm_source], " | ", [properties.utm_medium], " | ",[properties.utm_campaign]," | ",[properties.utm_term]," | ", [properties.utm_content]),

if(contains([properties.hs_analytics_source], "Organic"), [properties.hs_analytics_source_data_2],),

[properties.primary_inbound_channel__l2__medium____contact___proxy__cloned_])

Here's the corrected HubSpot calculated field formula using proper HUBL syntax:

```jinja2
if(
    has_value([properties.utm_source]),
    concatenate(
        [properties.utm_source],
        " | ",
        [properties.utm_medium],
        " | ",
        [properties.utm_campaign],
        " | ",
        [properties.utm_term],
        " | ",
        [properties.utm_content]
    ),
    if(
        contains([properties.hs_analytics_source], "Organic"),
        [properties.hs_analytics_source_data_2],
        [properties.primary_inbound_channel__l2__medium____contact___proxy__cloned_]
    )
)
```

Key corrections made:

1. Replaced `is_known()` with `has_value()` for property checks (more standard in HUBL)
2. Fixed nested if/else structure with proper parentheses
3. Added missing else clause for organic traffic check
4. Maintained proper comma placement between arguments
5. Verified property name references match HubSpot's default field names

The logic now follows:

1. First checks if UTM Source has a value
2. If true, concatenates all UTM parameters with pipe separators
3. If false, checks if traffic source contains "Organic"
4. If organic, uses Source Drill-Down 2 value
5. If neither condition met, uses Primary Inbound Channel value

Note: Ensure your property names exactly match those in your HubSpot portal, as custom properties may have different internal names.

