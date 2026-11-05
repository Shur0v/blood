import type {UsaArea} from './usaEdition';
// Canonical GeoNames city references. Coordinates disambiguate legacy same-name records;
// they are not municipal boundaries and never replace stored donor coordinates.
export const USA_CITY_REFERENCES:Record<string,{geonameId:number;lat:number;lng:number;state:string}>={
 'Las Vegas':{geonameId:5506956,lat:36.175,lng:-115.137,state:'NV'},
 'Los Angeles':{geonameId:5368361,lat:34.052,lng:-118.244,state:'CA'},
 'San Francisco':{geonameId:5391959,lat:37.775,lng:-122.419,state:'CA'},
 'San Diego':{geonameId:5391811,lat:32.715,lng:-117.157,state:'CA'},
 'New York':{geonameId:5128581,lat:40.714,lng:-74.006,state:'NY'},
 'New York City':{geonameId:5128581,lat:40.714,lng:-74.006,state:'NY'},
 Chicago:{geonameId:4887398,lat:41.85,lng:-87.65,state:'IL'},
 Houston:{geonameId:4699066,lat:29.763,lng:-95.363,state:'TX'},
 Dallas:{geonameId:4684888,lat:32.783,lng:-96.807,state:'TX'},
 Miami:{geonameId:4164138,lat:25.774,lng:-80.194,state:'FL'},
 Atlanta:{geonameId:4180439,lat:33.749,lng:-84.388,state:'GA'},
 Seattle:{geonameId:5809844,lat:47.606,lng:-122.332,state:'WA'},
 Boston:{geonameId:4930956,lat:42.358,lng:-71.06,state:'MA'},
 Phoenix:{geonameId:5308655,lat:33.448,lng:-112.074,state:'AZ'},
};
export function usaRecordMatchesArea(area:UsaArea,record:{city:string;lat:number|null;lng:number|null}){
 const city=area.directoryCities.find(city=>city.toLowerCase()===record.city.trim().toLowerCase());if(!city)return false;
 const ref=USA_CITY_REFERENCES[city];if(!ref||!Number.isFinite(record.lat)||!Number.isFinite(record.lng))return false;
 const radians=(v:number)=>v*Math.PI/180,dlat=radians(record.lat!-ref.lat),dlng=radians(record.lng!-ref.lng);
 const a=Math.sin(dlat/2)**2+Math.cos(radians(ref.lat))*Math.cos(radians(record.lat!))*Math.sin(dlng/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)))<=75;
}
