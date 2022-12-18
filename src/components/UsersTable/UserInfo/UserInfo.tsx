import React from "react";
import { Table } from "antd";

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
    },
    {
        title: "Followers",
        dataIndex: "followers",
        key: "followers"
    }
];


const UserInfo = ({user}:any) => {  
    user = user || {name: "", company: "", repos: "", location: ""};
    
    return (
          <Table 
            columns={columns} 
            pagination={false} 
            dataSource={[user]}/>
    )
};

export default UserInfo;