import * as React from 'react'

export const EyeOff = (props: React.HTMLAttributes<SVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15.0612 15.2503C15.5005 14.9155 15.5851 14.288 15.2503 13.8488C14.9155 13.4096 14.288 13.3249 13.8488 13.6597L15.0612 15.2503ZM10 16V17C10.0054 17 10.0109 17 10.0163 16.9999L10 16ZM1.75 10L0.868844 9.5272C0.71521 9.81351 0.710261 10.1566 0.855573 10.4472L1.75 10ZM6.1519 6.3398C6.59084 6.00462 6.67496 5.37707 6.33978 4.93812C6.0046 4.49918 5.37704 4.41507 4.9381 4.75025L6.1519 6.3398ZM8.19711 3.20634C7.65936 3.33221 7.32547 3.87018 7.45134 4.40793C7.57722 4.94568 8.11519 5.27957 8.65294 5.1537L8.19711 3.20634ZM10 4.00002L9.99767 5.00002H10V4.00002ZM18.25 10L19.1319 10.4714C19.2848 10.1854 19.2895 9.84292 19.1445 9.5528L18.25 10ZM15.8649 11.7487C15.5093 12.1713 15.5636 12.8021 15.9862 13.1577C16.4088 13.5133 17.0396 13.4589 17.3952 13.0364L15.8649 11.7487ZM12.3216 12.2717C12.6981 11.8677 12.6758 11.2349 12.2717 10.8584C11.8677 10.4819 11.2349 10.5042 10.8584 10.9083L12.3216 12.2717ZM9.09173 9.14164C9.49579 8.76513 9.51813 8.13236 9.14162 7.7283C8.76512 7.32424 8.13234 7.30191 7.72829 7.67841L9.09173 9.14164ZM13.8488 13.6597C12.7365 14.5076 11.3821 14.9773 9.98365 15.0002L10.0163 16.9999C11.8416 16.97 13.6094 16.357 15.0612 15.2503L13.8488 13.6597ZM10 15C7.77451 15 5.95802 13.7265 4.63579 12.3161C3.98379 11.6206 3.48075 10.9213 3.14082 10.395C2.97148 10.1328 2.84425 9.91604 2.76074 9.76758C2.71902 9.69341 2.68832 9.63649 2.66885 9.59969C2.65912 9.5813 2.6522 9.56795 2.64812 9.56001C2.64608 9.55604 2.64475 9.55343 2.64413 9.55221C2.64382 9.55161 2.64369 9.55135 2.64374 9.55145C2.64377 9.55149 2.64384 9.55163 2.64395 9.55186C2.64401 9.55197 2.64413 9.55221 2.64416 9.55227C2.64429 9.55253 2.64443 9.55281 1.75 10C0.855573 10.4472 0.855737 10.4476 0.855914 10.4479C0.855988 10.4481 0.856176 10.4484 0.856324 10.4487C0.856622 10.4493 0.856965 10.45 0.857356 10.4508C0.858137 10.4523 0.859105 10.4543 0.860259 10.4565C0.862566 10.4611 0.86562 10.4671 0.869416 10.4745C0.877008 10.4892 0.887575 10.5096 0.901096 10.5351C0.928131 10.5862 0.967018 10.6582 1.01758 10.7481C1.11864 10.9278 1.2668 11.1798 1.46074 11.4801C1.84738 12.0787 2.42246 12.8794 3.17671 13.684C4.66698 15.2736 6.97549 17 10 17V15ZM2.63116 10.4729C3.49665 8.85992 4.69708 7.45072 6.1519 6.3398L4.9381 4.75025C3.25662 6.03424 1.86918 7.66298 0.868844 9.5272L2.63116 10.4729ZM8.65294 5.1537C9.09371 5.05053 9.54499 4.99895 9.99767 5.00002L10.0024 3.00002C9.39466 2.99859 8.78884 3.06783 8.19711 3.20634L8.65294 5.1537ZM10 5.00002C12.2255 5.00002 14.042 6.27358 15.3642 7.68396C16.0162 8.37942 16.5193 9.07871 16.8592 9.60504C17.0285 9.86725 17.1558 10.084 17.2393 10.2325C17.281 10.3066 17.3117 10.3636 17.3312 10.4004C17.3409 10.4187 17.3478 10.4321 17.3519 10.44C17.3539 10.444 17.3553 10.4466 17.3559 10.4478C17.3562 10.4484 17.3563 10.4487 17.3563 10.4486C17.3563 10.4486 17.3562 10.4484 17.3561 10.4482C17.356 10.4481 17.3559 10.4478 17.3559 10.4478C17.3557 10.4475 17.3556 10.4472 18.25 10C19.1445 9.5528 19.1443 9.55248 19.1441 9.55212C19.144 9.55198 19.1438 9.5516 19.1437 9.5513C19.1434 9.55071 19.1431 9.55003 19.1427 9.54925C19.1419 9.5477 19.1409 9.54578 19.1398 9.54351C19.1375 9.53896 19.1344 9.53296 19.1306 9.52558C19.123 9.51081 19.1124 9.49047 19.0989 9.46492C19.0719 9.41383 19.033 9.34184 18.9824 9.25195C18.8814 9.07228 18.7332 8.82029 18.5393 8.51999C18.1526 7.92133 17.5776 7.12061 16.8233 6.31608C15.333 4.72646 13.0245 3.00002 10 3.00002V5.00002ZM17.3681 9.52861C16.9457 10.3189 16.4418 11.063 15.8649 11.7487L17.3952 13.0364C18.0618 12.2442 18.6439 11.3845 19.1319 10.4714L17.3681 9.52861ZM10.8584 10.9083C10.5468 11.2427 10.0775 11.3804 9.63458 11.2673L9.1397 13.2051C10.2912 13.4992 11.5114 13.1412 12.3216 12.2717L10.8584 10.9083ZM9.63458 11.2673C9.19169 11.1542 8.84586 10.8083 8.73276 10.3654L6.79495 10.8603C7.08903 12.0118 7.98819 12.911 9.1397 13.2051L9.63458 11.2673ZM8.73276 10.3654C8.61965 9.92256 8.75731 9.45325 9.09173 9.14164L7.72829 7.67841C6.85879 8.48862 6.50087 9.70882 6.79495 10.8603L8.73276 10.3654Z"
      fill="#4C68C1"
    />
    <path
      d="M1.75 1.75L18.25 18.25"
      stroke="#4C68C1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)