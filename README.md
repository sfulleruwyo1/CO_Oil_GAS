# CO_Oil_GAS
Colorado Oil and Gas Locations

```CLI
mapshaper Wells.shp -filter-fields Facil_Id,Well_Name,Operator,Facil_Stat -simplify dp 15% -proj wgs84 -o precision=.00001 format=geojson wells.json
```
