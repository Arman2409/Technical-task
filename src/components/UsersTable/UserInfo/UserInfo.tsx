import React from "react";
import { Table } from "antd";

React.useLayoutEffect = React.useEffect 

const columns = [
    {
        title: "Name",
        dataIndex: "name",
        key: "name"
    },
    {
        title: "Company",
        dataIndex: "company",
        key: "company"
    },
    {
        title: "Location",
        dataIndex: "location",
        key: "location"
    },
    {
        title: "Repositories",
        dataIndex: "repos",
        key: "repos"
    }
];


const UserInfo = ({user}:any) => {  

    console.log(user);
    
    return (
          <Table columns={columns} pagination={false} dataSource={[user || {}]}/>
    )
};

export default UserInfo;